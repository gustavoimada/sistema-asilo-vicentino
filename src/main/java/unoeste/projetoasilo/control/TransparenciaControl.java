package unoeste.projetoasilo.control;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.Transparencia;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.sql.SQLException;
import java.util.Locale;

@RestController
@RequestMapping("transparencia")
public class TransparenciaControl
{
    private static final long TAMANHO_MAXIMO_PDF = 20L * 1024L * 1024L;

    private final Path raizUpload = Paths.get(uploadDirBase(), "transparencia").toAbsolutePath().normalize();
    // Recebe o PDF enviado pelo coordenador e salva o arquivo no servidor.
    @PostMapping("upload")
    public ResponseEntity<Object> upload(@RequestParam("arquivo") MultipartFile arquivo,
                                         @RequestParam(value = "dataReferencia", required = false) String dataReferencia,
                                         @RequestParam(value = "ano", required = false) String ano,
                                         @RequestParam(value = "mes", required = false) String mes,
                                         @RequestParam("evento") String evento,
                                         @RequestParam(value = "observacao", required = false) String observacao,
                                         HttpSession session)
    {
        LocalDate dataReferenciaLimpa;
        String observacaoLimpa;
        try
        {
            dataReferenciaLimpa = limparDataReferencia(dataReferencia);
            observacaoLimpa = limparObservacao(observacao);
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }

        String anoLimpo = limparAno(ano);
        int mesNumero = limparMes(mes);
        String eventoLimpo = limparEvento(evento);

        if (dataReferenciaLimpa != null)
        {
            anoLimpo = String.valueOf(dataReferenciaLimpa.getYear());
            mesNumero = dataReferenciaLimpa.getMonthValue();
        }

        if (anoLimpo.isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Ano invalido"));
        }

        if (mesNumero <= 0)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Mes invalido"));
        }

        if (dataReferenciaLimpa == null)
        {
            dataReferenciaLimpa = LocalDate.of(Integer.parseInt(anoLimpo), mesNumero, 1);
        }

        if (eventoLimpo.isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Evento obrigatorio"));
        }

        if (arquivo == null || arquivo.isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Selecione um PDF para enviar"));
        }

        String nomeOriginal;
        if (arquivo.getOriginalFilename() == null)
        {
            nomeOriginal = "";
        }
        else
        {
            nomeOriginal = arquivo.getOriginalFilename();
        }

        if (arquivo.getSize() > TAMANHO_MAXIMO_PDF)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "O PDF deve ter no maximo 20 MB"));
        }

        if (!nomeOriginal.toLowerCase(Locale.ROOT).endsWith(".pdf") || !arquivoEhPdf(arquivo))
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Somente arquivos PDF sao permitidos"));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario responsavel nao encontrado"));
            }
            if (!ehCoordenador(funcionario))
            {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas coordenadores podem enviar arquivos"));
            }

            String pastaEvento = limparNomePasta(eventoLimpo);
            String pastaMes = String.format("%02d-%s", mesNumero, limparNomePasta(nomeMes(mesNumero)));
            Files.createDirectories(raizUpload.resolve(anoLimpo).resolve(pastaMes).resolve(pastaEvento));
            String baseNome = limparNomeArquivo(nomeOriginal);
            String nomeArquivo = Instant.now().toEpochMilli() + "-" + baseNome + ".pdf";
            Path destino = raizUpload.resolve(anoLimpo).resolve(pastaMes).resolve(pastaEvento).resolve(nomeArquivo).normalize();

            if (!destino.startsWith(raizUpload))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nome de arquivo invalido"));
            }

            try (InputStream stream = arquivo.getInputStream())
            {
                Files.copy(stream, destino, StandardCopyOption.REPLACE_EXISTING);
            }

            Transparencia transparencia = new Transparencia();
            transparencia.setAno(Integer.parseInt(anoLimpo));
            transparencia.setMes(mesNumero);
            transparencia.setNomeArquivo(nomeArquivo);
            transparencia.setEvento(eventoLimpo);
            transparencia.setDataReferencia(dataReferenciaLimpa);
            transparencia.setObservacao(observacaoLimpa);
            transparencia.setCaminhoArquivo(raizUpload.relativize(destino).toString().replace("\\", "/"));
            transparencia.setFuncionario(funcionario);

            if (!transparencia.gravar(conexao))
            {
                Files.deleteIfExists(destino);
                return ResponseEntity.badRequest().body(new Error("Erro", "Arquivo salvo, mas nao foi possivel registrar no banco"));
            }

            return ResponseEntity.ok(transparencia);
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        catch (IOException | SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao salvar arquivo"));
        }
        finally
        {
            conexao.fechar();
        }
    }

    // Exclui um arquivo de transparencia e tambem remove o registro do banco.
    @DeleteMapping("deletar/{id}")
    public ResponseEntity<Object> deletar(@PathVariable int id, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null || !ehCoordenador(funcionario))
            {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas coordenadores podem excluir arquivos"));
            }

            Transparencia transparencia = new Transparencia().buscarPorId(id, conexao);
            if (transparencia == null)
            {
                return ResponseEntity.notFound().build();
            }

            Path caminho = raizUpload.resolve(transparencia.getCaminhoArquivo()).normalize();
            if (!caminho.startsWith(raizUpload))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Caminho de arquivo invalido"));
            }

            if (!transparencia.excluir(id, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o registro no banco"));
            }

            if (Files.exists(caminho) && Files.isRegularFile(caminho))
            {
                Files.deleteIfExists(caminho);
            }

            return ResponseEntity.ok().build();
        }
        catch (IOException | SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao excluir arquivo"));
        }
        finally
        {
            conexao.fechar();
        }
    }

    // Faz o download publico do PDF salvo.
    @GetMapping("download/{id}")
    public ResponseEntity<Object> download(@PathVariable int id)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Transparencia transparencia = new Transparencia().buscarPorId(id, conexao);
            if (transparencia == null)
            {
                return ResponseEntity.notFound().build();
            }

            Path caminho = raizUpload.resolve(transparencia.getCaminhoArquivo()).normalize();
            if (!caminho.startsWith(raizUpload) || !Files.exists(caminho) || !Files.isRegularFile(caminho))
            {
                return ResponseEntity.notFound().build();
            }

            Resource recurso = new UrlResource(caminho.toUri());
            String nomeDownload = URLEncoder.encode(caminho.getFileName().toString(), StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + nomeDownload)
                    .body(recurso);
        }
        catch (MalformedURLException | SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Arquivo invalido"));
        }
        finally
        {
            conexao.fechar();
        }
    }

    // Lista os arquivos de transparencia cadastrados no banco.
    @GetMapping("listar")
    public ResponseEntity<Object> listar()
    {
        Banco conexao = Banco.getConnection();
        Transparencia transparencia = new Transparencia();
        try
        {
            return ResponseEntity.ok(transparencia.listar(conexao));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao listar arquivos de transparencia"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Deixa o ano somente com numeros e valida se tem quatro digitos.
    private String limparAno(String ano)
    {
        String anoOriginal;
        if (ano == null)
        {
            anoOriginal = "";
        }
        else
        {
            anoOriginal = ano;
        }

        String valor = String.valueOf(anoOriginal).replaceAll("[^0-9]", "");
        if (valor.matches("\\d{4}"))
        {
            return valor;
        }
        return "";
    }

    private int limparMes(String mes)
    {
        if (mes == null)
        {
            return 0;
        }

        String valor = mes.replaceAll("[^0-9]", "");
        if (!valor.matches("\\d{1,2}"))
        {
            return 0;
        }

        int numero = Integer.parseInt(valor);
        if (numero < 1 || numero > 12)
        {
            return 0;
        }
        return numero;
    }

    private LocalDate limparDataReferencia(String dataReferencia)
    {
        if (dataReferencia == null || dataReferencia.isBlank())
        {
            return null;
        }

        try
        {
            return LocalDate.parse(dataReferencia.trim());
        }
        catch (Exception e)
        {
            throw new IllegalArgumentException("Data de referencia invalida");
        }
    }

    private String nomeMes(int mes)
    {
        return switch (mes)
        {
            case 1 -> "Janeiro";
            case 2 -> "Fevereiro";
            case 3 -> "Marco";
            case 4 -> "Abril";
            case 5 -> "Maio";
            case 6 -> "Junho";
            case 7 -> "Julho";
            case 8 -> "Agosto";
            case 9 -> "Setembro";
            case 10 -> "Outubro";
            case 11 -> "Novembro";
            case 12 -> "Dezembro";
            default -> "Mes";
        };
    }

    // Limpa o nome do arquivo para evitar caracteres ruins no caminho.
    private String limparNomeArquivo(String nome)
    {
        String semExtensao = nome.replaceFirst("(?i)\\.pdf$", "");
        String padronizado = java.text.Normalizer.normalize(semExtensao, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String limpo = padronizado.replaceAll("[^a-zA-Z0-9._-]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        if (limpo.isBlank())
        {
            return "prestacao-contas";
        }
        return limpo;
    }

    // Limpa o nome do evento para usar como pasta.
    private String limparNomePasta(String nome)
    {
        String padronizado = java.text.Normalizer.normalize(nome, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String limpo = padronizado.replaceAll("[^a-zA-Z0-9._-]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        if (limpo.isBlank())
        {
            return "outros";
        }
        return limpo.toLowerCase(Locale.ROOT);
    }

    // Limpa o texto do evento antes de salvar.
    private String limparEvento(String evento)
    {
        String eventoOriginal;
        if (evento == null)
        {
            eventoOriginal = "";
        }
        else
        {
            eventoOriginal = evento;
        }

        String valor = String.valueOf(eventoOriginal).trim().replaceAll("\\s+", " ");
        if (valor.length() > 80)
        {
            valor = valor.substring(0, 80).trim();
        }
        return valor;
    }

    private String limparObservacao(String observacao)
    {
        if (observacao == null)
        {
            return null;
        }

        String valor = observacao.trim().replaceAll("\\s+", " ");
        if (valor.isBlank())
        {
            return null;
        }
        if (valor.length() > 500)
        {
            throw new IllegalArgumentException("Observacao deve ter no maximo 500 caracteres");
        }
        return valor;
    }

    private boolean arquivoEhPdf(MultipartFile arquivo)
    {
        try (InputStream stream = arquivo.getInputStream())
        {
            byte[] cabecalho = stream.readNBytes(5);
            return cabecalho.length == 5
                    && cabecalho[0] == 0x25
                    && cabecalho[1] == 0x50
                    && cabecalho[2] == 0x44
                    && cabecalho[3] == 0x46
                    && cabecalho[4] == 0x2D;
        }
        catch (IOException e)
        {
            return false;
        }
    }

    // Confere se o funcionario logado e coordenador.
    private boolean ehCoordenador(Funcionario funcionario)
    {
        return funcionario != null && "Coordenador".equalsIgnoreCase(String.valueOf(funcionario.getCategoria()).trim());
    }

    // Busca o funcionario logado usando os dados gravados na sessao.
    private Funcionario buscarFuncionarioDaSessao(HttpSession session, Banco conexao) throws SQLException
    {
        if (session == null)
        {
            return null;
        }

        Object idFuncionarioSessao = session.getAttribute("idFuncionario");
        if (idFuncionarioSessao != null)
        {
            int idFuncionario = Integer.parseInt(String.valueOf(idFuncionarioSessao));
            if (idFuncionario > 0)
            {
                Funcionario funcionario = new Funcionario().buscarId(idFuncionario, conexao);
                if (funcionario != null)
                {
                    return funcionario;
                }
            }
        }

        Object idUserSessao = session.getAttribute("idUser");
        if (idUserSessao != null)
        {
            int idUser = Integer.parseInt(String.valueOf(idUserSessao));
            if (idUser > 0)
            {
                return new Funcionario().buscarPorUsuario(idUser, conexao);
            }
        }

        return null;
    }

    private static String uploadDirBase()
    {
        String valor = System.getenv("UPLOAD_DIR");
        if (valor == null || valor.isBlank())
        {
            return "uploads";
        }
        return valor.trim();
    }
}
