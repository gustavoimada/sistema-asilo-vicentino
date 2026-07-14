package unoeste.projetoasilo.control;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import unoeste.projetoasilo.dao.NoticiaDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Noticia;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("noticia")
public class NoticiaControl {

    private static final long TAMANHO_MAXIMO_IMAGEM = 10L * 1024L * 1024L;
    private static final Set<String> TIPOS_IMAGEM_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path raizUpload = Paths.get(uploadDirBase(), "noticias").toAbsolutePath().normalize();
    @PostMapping("upload")
    public ResponseEntity<Object> upload(@RequestParam("titulo") String titulo,
                                         @RequestParam("descricao") String descricao,
                                         @RequestParam("categoria") String categoria,
                                         @RequestParam("imagem") MultipartFile imagem,
                                         HttpSession session) {

        if (titulo == null || titulo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new Error("Erro", "O título da notícia é obrigatório."));
        }
        if (descricao == null || descricao.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new Error("Erro", "A descrição da notícia é obrigatória."));
        }
        if (categoria == null || categoria.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Selecione uma categoria para a notícia."));
        }
        if (imagem == null || imagem.isEmpty()) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Selecione uma imagem para publicar a notícia."));
        }

        String erroImagem = validarImagem(imagem);
        if (erroImagem != null) {
            return ResponseEntity.badRequest().body(new Error("Erro", erroImagem));
        }

        Banco conexao = Banco.getConnection();
        try {

            if (!ehAutorizado(session)) {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas secretarias ou coordenadores podem publicar noticias"));
            }

            String nomeOriginal = limparNomeArquivo(imagem.getOriginalFilename());
            Noticia noticia = new Noticia();
            noticia.setTitulo(titulo.trim());
            noticia.setDescricao(descricao.trim());
            noticia.setCategoria(categoria.trim());
            noticia.setDataUpload(LocalDate.now());

            NoticiaDAO dao = new NoticiaDAO();
            if (dao.existeTitulo(noticia.getTitulo(), -1, conexao)) {
                return ResponseEntity.status(409).body(new Error("Erro", "Já existe uma notícia com este título. Escolha outro nome."));
            }

            Path destino = salvarImagem(imagem, nomeOriginal);
            noticia.setNomeImagem(nomeOriginal);
            noticia.setImagemCaminho(raizUpload.relativize(destino).toString().replace("\\", "/"));

            if (!dao.gravar(noticia, conexao)) {
                Files.deleteIfExists(destino);
                return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar a notícia. Tente novamente."));
            }
            return ResponseEntity.ok(noticia);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar a imagem. Verifique o arquivo e tente novamente."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editar(@PathVariable int id,
                                         @RequestParam("titulo") String titulo,
                                         @RequestParam("descricao") String descricao,
                                         @RequestParam("categoria") String categoria,
                                         @RequestParam(value = "imagem", required = false) MultipartFile imagem,
                                         HttpSession session) {
        if (titulo == null || titulo.trim().isEmpty()) return ResponseEntity.badRequest().body(new Error("Erro", "O título da notícia é obrigatório."));
        if (descricao == null || descricao.trim().isEmpty()) return ResponseEntity.badRequest().body(new Error("Erro", "A descrição da notícia é obrigatória."));
        if (categoria == null || categoria.trim().isEmpty()) return ResponseEntity.badRequest().body(new Error("Erro", "Selecione uma categoria para a notícia."));

        Banco conexao = Banco.getConnection();
        try {
            if (!ehAutorizado(session)) {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas secretarias ou coordenadores podem editar noticias"));
            }

            NoticiaDAO dao = new NoticiaDAO();
            Noticia noticia = dao.buscarPorId(id, conexao);
            if (noticia == null) {
                return ResponseEntity.notFound().build();
            }

            noticia.setTitulo(titulo.trim());
            noticia.setDescricao(descricao.trim());
            noticia.setCategoria(categoria.trim());

            if (dao.existeTitulo(noticia.getTitulo(), noticia.getIdNoticia(), conexao)) {
                return ResponseEntity.status(409).body(new Error("Erro", "Já existe uma notícia com este título. Escolha outro nome."));
            }

            Path imagemNova = null;
            Path imagemAntiga = null;
            if (imagem != null && !imagem.isEmpty()) {
                String erroImagem = validarImagem(imagem);
                if (erroImagem != null) {
                    return ResponseEntity.badRequest().body(new Error("Erro", erroImagem));
                }

                String nomeOriginal = limparNomeArquivo(imagem.getOriginalFilename());
                imagemNova = salvarImagem(imagem, nomeOriginal);
                imagemAntiga = caminhoSeguro(noticia.getImagemCaminho());

                noticia.setNomeImagem(nomeOriginal);
                noticia.setImagemCaminho(raizUpload.relativize(imagemNova).toString().replace("\\", "/"));
            }

            if (!dao.editar(noticia, conexao)) {
                if (imagemNova != null) {
                    Files.deleteIfExists(imagemNova);
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar as alterações. Tente novamente."));
            }

            if (imagemAntiga != null && Files.exists(imagemAntiga) && Files.isRegularFile(imagemAntiga)) {
                Files.deleteIfExists(imagemAntiga);
            }

            return ResponseEntity.ok(noticia);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar as alterações. Tente novamente."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("deletar/{id}")
    public ResponseEntity<Object> deletar(@PathVariable int id, HttpSession session) {
        Banco conexao = Banco.getConnection();
        try {
            if (!ehAutorizado(session)) {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas secretarias ou coordenadores podem excluir noticias"));
            }

            NoticiaDAO dao = new NoticiaDAO();
            Noticia noticia = dao.buscarPorId(id, conexao);
            if (noticia == null) {
                return ResponseEntity.notFound().build();
            }

            Path caminho = caminhoSeguro(noticia.getImagemCaminho());

            if (!dao.excluir(id, conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível excluir a notícia. Tente novamente."));
            }

            if (caminho != null && Files.exists(caminho) && Files.isRegularFile(caminho)) {
                Files.deleteIfExists(caminho);
            }

            return ResponseEntity.ok().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível excluir a notícia. Tente novamente."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listar() {
        Banco conexao = Banco.getConnection();
        NoticiaDAO dao = new NoticiaDAO();
        try {
            return ResponseEntity.ok(dao.listar(conexao));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao listar noticias"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("download/{id}")
    public ResponseEntity<Object> download(@PathVariable int id) {
        Banco conexao = Banco.getConnection();
        try {
            NoticiaDAO dao = new NoticiaDAO();
            Noticia noticia = dao.buscarPorId(id, conexao);
            if (noticia == null) {
                return ResponseEntity.notFound().build();
            }

            Path caminho = caminhoSeguro(noticia.getImagemCaminho());
            if (caminho == null || !Files.exists(caminho) || !Files.isRegularFile(caminho)) {
                return ResponseEntity.notFound().build();
            }

            Resource recurso = new UrlResource(caminho.toUri());
            String mimeType = Files.probeContentType(caminho);
            if (mimeType == null) mimeType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, max-age=0, must-revalidate")
                    .contentType(MediaType.parseMediaType(mimeType))
                    .body(recurso);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Arquivo invalido"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private String limparNomeArquivo(String nome) {
        if (nome == null || nome.isEmpty()) return "imagem.jpg";
        String padronizado = java.text.Normalizer.normalize(nome, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String limpo = padronizado.replaceAll("[^a-zA-Z0-9._-]+", "-").replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
        return limpo.isBlank() ? "imagem.jpg" : limpo;
    }

    private String validarImagem(MultipartFile imagem) {
        if (imagem.getSize() > TAMANHO_MAXIMO_IMAGEM) {
            return "A imagem deve ter no maximo 10 MB.";
        }

        String contentType = imagem.getContentType() == null ? "" : imagem.getContentType().toLowerCase(Locale.ROOT);
        if (!TIPOS_IMAGEM_PERMITIDOS.contains(contentType)) {
            return "Use uma imagem JPG, PNG ou WEBP.";
        }

        String nome = imagem.getOriginalFilename() == null ? "" : imagem.getOriginalFilename().toLowerCase(Locale.ROOT);
        String tipoEsperado = nome.endsWith(".jpg") || nome.endsWith(".jpeg") ? "image/jpeg"
                : nome.endsWith(".png") ? "image/png"
                : nome.endsWith(".webp") ? "image/webp" : "";
        if (tipoEsperado.isEmpty() || !tipoEsperado.equals(contentType)) {
            return "A extensao da imagem nao corresponde ao formato informado.";
        }

        try (InputStream stream = imagem.getInputStream()) {
            byte[] cabecalho = stream.readNBytes(12);
            String tipoDetectado = detectarTipoImagem(cabecalho);
            if (!contentType.equals(tipoDetectado)) {
                return "O conteudo do arquivo nao corresponde a uma imagem valida.";
            }
        } catch (IOException e) {
            return "Nao foi possivel ler a imagem enviada.";
        }

        return null;
    }

    private String detectarTipoImagem(byte[] cabecalho) {
        if (cabecalho.length >= 3 && (cabecalho[0] & 0xFF) == 0xFF && (cabecalho[1] & 0xFF) == 0xD8 && (cabecalho[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (cabecalho.length >= 8 && (cabecalho[0] & 0xFF) == 0x89 && cabecalho[1] == 0x50 && cabecalho[2] == 0x4E && cabecalho[3] == 0x47
                && cabecalho[4] == 0x0D && cabecalho[5] == 0x0A && cabecalho[6] == 0x1A && cabecalho[7] == 0x0A) {
            return "image/png";
        }
        if (cabecalho.length >= 12 && cabecalho[0] == 0x52 && cabecalho[1] == 0x49 && cabecalho[2] == 0x46 && cabecalho[3] == 0x46
                && cabecalho[8] == 0x57 && cabecalho[9] == 0x45 && cabecalho[10] == 0x42 && cabecalho[11] == 0x50) {
            return "image/webp";
        }
        return "";
    }

    private Path salvarImagem(MultipartFile imagem, String nomeOriginal) throws IOException {
        Files.createDirectories(raizUpload);
        Path destino = raizUpload.resolve(Instant.now().toEpochMilli() + "-" + nomeOriginal).normalize();
        if (!destino.startsWith(raizUpload)) {
            throw new IOException("Nome de arquivo invalido");
        }
        try (InputStream stream = imagem.getInputStream()) {
            Files.copy(stream, destino, StandardCopyOption.REPLACE_EXISTING);
        }
        return destino;
    }

    private Path caminhoSeguro(String caminhoRelativo) {
        if (caminhoRelativo == null || caminhoRelativo.isBlank()) {
            return null;
        }
        Path caminho = raizUpload.resolve(caminhoRelativo).normalize();
        return caminho.startsWith(raizUpload) ? caminho : null;
    }

    private boolean ehAutorizado(HttpSession session) {
        if (session == null) return false;
        Object categoria = session.getAttribute("categoria");
        if (categoria == null) return false;
        String cat = String.valueOf(categoria).trim().toLowerCase();
        return "secretaria".equals(cat) || "coordenador".equals(cat);
    }

    private static String uploadDirBase() {
        String valor = System.getenv("UPLOAD_DIR");
        if (valor == null || valor.isBlank()) {
            return "uploads";
        }
        return valor.trim();
    }
}
