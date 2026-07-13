package unoeste.projetoasilo.control;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import unoeste.projetoasilo.entities.Error;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("backup")
public class BackupControl
{
    private final Path raizUpload = Paths.get(uploadDirBase()).toAbsolutePath().normalize();

    @GetMapping("uploads.zip")
    public ResponseEntity<Object> baixarUploads()
    {
        if (!Files.exists(raizUpload) || !Files.isDirectory(raizUpload))
        {
            return ResponseEntity.status(404).body(new Error("Erro", "Pasta de uploads nao encontrada"));
        }

        StreamingResponseBody stream = outputStream ->
        {
            try (ZipOutputStream zip = new ZipOutputStream(outputStream);
                 Stream<Path> arquivos = Files.walk(raizUpload))
            {
                Iterator<Path> iterator = arquivos
                        .filter(Files::isRegularFile)
                        .iterator();

                while (iterator.hasNext())
                {
                    adicionarArquivo(zip, iterator.next());
                }
            }
        };

        String nomeArquivo = "uploads-sgav-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".zip";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeArquivo + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(stream);
    }

    private void adicionarArquivo(ZipOutputStream zip, Path arquivo) throws IOException
    {
        Path caminhoRelativo = raizUpload.relativize(arquivo);
        String nomeNoZip = caminhoRelativo.toString().replace("\\", "/");

        zip.putNextEntry(new ZipEntry(nomeNoZip));
        Files.copy(arquivo, zip);
        zip.closeEntry();
    }

    private String uploadDirBase()
    {
        String configurado = System.getenv("UPLOAD_DIR");
        if (configurado == null || configurado.isBlank())
        {
            return "uploads";
        }
        return configurado;
    }
}
