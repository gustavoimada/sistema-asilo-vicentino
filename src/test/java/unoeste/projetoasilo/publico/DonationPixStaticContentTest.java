package unoeste.projetoasilo.publico;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DonationPixStaticContentTest
{
    private static final String RECEBEDOR_OFICIAL =
            "ASSOCIACAO DO ASILO VICENTINO NOSSA SENHORA DA PENHA";

    @Test
    void modalExibeQrCodeERecebedorOficiaisSemAvisosDeDemonstracao() throws Exception
    {
        String html = lerRecurso("static/index.html");

        assertTrue(html.contains("assets/qrcode-doacao.png"));
        assertTrue(html.contains(RECEBEDOR_OFICIAL));
        assertFalse(html.contains("Demonstração"));
        assertFalse(html.contains("demonstrativo"));
        assertFalse(html.contains("fictício"));
    }

    @Test
    void qrCodeOficialExisteComoImagemPngLegivel() throws Exception
    {
        try (InputStream stream = recurso("static/assets/qrcode-doacao.png"))
        {
            BufferedImage imagem = ImageIO.read(stream);

            assertNotNull(imagem);
            assertTrue(imagem.getWidth() > 0);
            assertTrue(imagem.getHeight() > 0);
        }
    }

    private String lerRecurso(String caminho) throws Exception
    {
        try (InputStream stream = recurso(caminho))
        {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private InputStream recurso(String caminho)
    {
        InputStream stream = getClass().getClassLoader().getResourceAsStream(caminho);
        assertNotNull(stream, "Recurso ausente: " + caminho);
        return stream;
    }
}
