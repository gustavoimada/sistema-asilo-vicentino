package unoeste.projetoasilo.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TextoFormatadorTest
{
    @Test
    void normalizaTitulosSemForcarCaixaAlta()
    {
        assertEquals("Atividade Fisica", TextoFormatador.normalizarTitulo("ATIVIDADE FISICA"));
        assertEquals("Roda de Conversa", TextoFormatador.normalizarTitulo("roda DE conversa"));
        assertEquals("APAE de Pirapozinho", TextoFormatador.normalizarTitulo("apae DE PIRAPOZINHO"));
    }

    @Test
    void comparaTextosSemDiferenciarMaiusculasOuAcentos()
    {
        assertEquals(
                TextoFormatador.chaveDeComparacao("Atividade Fisica"),
                TextoFormatador.chaveDeComparacao("ATIVIDADE FISICA"));
    }
}
