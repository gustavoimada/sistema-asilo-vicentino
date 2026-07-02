package unoeste.projetoasilo.control;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;

@RestController
@RequestMapping("noticia")
public class NoticiaControl {

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

        String contentType = imagem.getContentType() == null ? "" : imagem.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(new Error("Erro", "O arquivo enviado não é uma imagem. Use formatos como JPG, PNG ou WEBP."));
        }

        Banco conexao = Banco.getConnection();
        try {

            if (!ehAutorizado(session)) {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas secretarias ou coordenadores podem publicar noticias"));
            }

            Files.createDirectories(raizUpload);
            String nomeOriginal = limparNomeArquivo(imagem.getOriginalFilename());
            String nomeArquivo = Instant.now().toEpochMilli() + "-" + nomeOriginal;
            Path destino = raizUpload.resolve(nomeArquivo).normalize();

            if (!destino.startsWith(raizUpload)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "O nome do arquivo contém caracteres inválidos. Renomeie o arquivo e tente novamente."));
            }

            Files.copy(imagem.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            Noticia noticia = new Noticia();
            noticia.setTitulo(titulo.trim());
            noticia.setDescricao(descricao.trim());
            noticia.setCategoria(categoria.trim());
            noticia.setNomeImagem(nomeOriginal);
            noticia.setImagemCaminho(raizUpload.relativize(destino).toString().replace("\\", "/"));
            noticia.setDataUpload(LocalDate.now());

            NoticiaDAO dao = new NoticiaDAO();
            if (dao.existeTitulo(noticia.getTitulo(), -1, conexao)) {
                Files.deleteIfExists(destino);
                return ResponseEntity.status(409).body(new Error("Erro", "Já existe uma notícia com este título. Escolha outro nome."));
            }
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

            if (imagem != null && !imagem.isEmpty()) {
                String contentType = imagem.getContentType() == null ? "" : imagem.getContentType().toLowerCase(Locale.ROOT);
                if (!contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().body(new Error("Erro", "O arquivo enviado não é uma imagem. Use formatos como JPG, PNG ou WEBP."));
                }

                Files.createDirectories(raizUpload);
                String nomeOriginal = limparNomeArquivo(imagem.getOriginalFilename());
                String nomeArquivo = Instant.now().toEpochMilli() + "-" + nomeOriginal;
                Path destino = raizUpload.resolve(nomeArquivo).normalize();

                Files.copy(imagem.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

                Path caminhoAntigo = raizUpload.resolve(noticia.getImagemCaminho()).normalize();
                if (Files.exists(caminhoAntigo) && Files.isRegularFile(caminhoAntigo)) {
                    Files.deleteIfExists(caminhoAntigo);
                }

                noticia.setNomeImagem(nomeOriginal);
                noticia.setImagemCaminho(raizUpload.relativize(destino).toString().replace("\\", "/"));
            }

            if (dao.existeTitulo(noticia.getTitulo(), noticia.getIdNoticia(), conexao)) {
                return ResponseEntity.status(409).body(new Error("Erro", "Já existe uma notícia com este título. Escolha outro nome."));
            }
            if (!dao.editar(noticia, conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar as alterações. Tente novamente."));
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

            Path caminho = raizUpload.resolve(noticia.getImagemCaminho()).normalize();
            if (caminho.startsWith(raizUpload) && Files.exists(caminho) && Files.isRegularFile(caminho)) {
                Files.deleteIfExists(caminho);
            }

            if (!dao.excluir(id, conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível excluir a notícia. Tente novamente."));
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

            Path caminho = raizUpload.resolve(noticia.getImagemCaminho()).normalize();
            if (!caminho.startsWith(raizUpload) || !Files.exists(caminho) || !Files.isRegularFile(caminho)) {
                return ResponseEntity.notFound().build();
            }

            Resource recurso = new UrlResource(caminho.toUri());
            String mimeType = Files.probeContentType(caminho);
            if (mimeType == null) mimeType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
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
