package unoeste.projetoasilo.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

public final class TextoFormatador
{
    private static final Locale PORTUGUES_BRASIL = Locale.forLanguageTag("pt-BR");
    private static final Set<String> PALAVRAS_MENORES = Set.of(
            "a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "em", "para", "por", "com", "sem");
    private static final Set<String> SIGLAS = Set.of(
            "apae", "cnpj", "cpf", "cras", "creas", "inss", "mei", "ong", "pix", "sus", "ubs");

    private TextoFormatador()
    {
    }

    public static String normalizarTitulo(String valor)
    {
        String texto = limpar(valor);
        if (texto.isEmpty())
        {
            return texto;
        }

        String[] palavras = texto.toLowerCase(PORTUGUES_BRASIL).split(" ");
        StringBuilder resultado = new StringBuilder();

        for (int indice = 0; indice < palavras.length; indice++)
        {
            String palavra = palavras[indice];

            if (indice > 0 && PALAVRAS_MENORES.contains(palavra))
            {
                adicionarPalavra(resultado, palavra);
            }
            else if (SIGLAS.contains(palavra))
            {
                adicionarPalavra(resultado, palavra.toUpperCase(Locale.ROOT));
            }
            else
            {
                adicionarPalavra(resultado, palavra.substring(0, 1).toUpperCase(PORTUGUES_BRASIL) + palavra.substring(1));
            }
        }

        return resultado.toString();
    }

    public static String chaveDeComparacao(String valor)
    {
        String texto = limpar(valor);
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    private static String limpar(String valor)
    {
        return valor == null ? "" : valor.trim().replaceAll("\\s+", " ");
    }

    private static void adicionarPalavra(StringBuilder resultado, String palavra)
    {
        if (!resultado.isEmpty())
        {
            resultado.append(' ');
        }
        resultado.append(palavra);
    }
}
