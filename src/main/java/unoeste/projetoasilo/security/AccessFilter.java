package unoeste.projetoasilo.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.text.Normalizer;
import java.util.Set;

public class AccessFilter implements Filter
{
    private static final Set<String> PAGINAS_SECRETARIA = Set.of(
            "/secretaria.html",
            "/funcionario.html",
            "/morador.html",
            "/composicaofamiliar.html",
            "/historico.html",
            "/medicamentos.html",
            "/cadastrarPrescricao.html",
            "/tipoOcorrencia.html",
            "/doacao.html",
            "/quartos.html",
            "/cadastroQuartos.html",
            "/tipoAtividades.html",
            "/atividades.html",
            "/tiposDespesas.html",
            "/despesa.html"
    );

    private static final Set<String> PAGINAS_COORDENADOR = Set.of(
            "/coordenador.html",
            "/escalas.html",
            "/transparencia.html",
            "/relatorioDoacoes.html",
            "/relatorioDespesas.html",
            "/defineTurno.html"
    );

    private static final Set<String> PAGINAS_COORDENADOR_E_SECRETARIA = Set.of(
            "/noticias.html"
    );

    private static final Set<String> PAGINAS_CUIDADOR = Set.of(
            "/cuidador.html",
            "/ocorrencia.html",
            "/registrarUsoMedicacao.html"
    );

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException
    {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String rota = rotaSemContexto(request);

        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || rotaPublica(rota))
        {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        if ("/login.html".equals(rota))
        {
            HttpSession session = request.getSession(false);
            if (session != null)
            {
                session.invalidate();
            }
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        HttpSession session = request.getSession(false);
        String categoria = categoriaDaSessao(session);
        if (categoria.isEmpty())
        {
            negarAcesso(request, response, "Acesso nao autorizado", 401);
            return;
        }

        if (!podeAcessar(rota, categoria))
        {
            negarAcesso(request, response, "Usuario sem permissao para acessar este recurso", 403);
            return;
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }

    private String rotaSemContexto(HttpServletRequest request)
    {
        String uri = request.getRequestURI();
        String contexto = request.getContextPath();
        if (contexto != null && !contexto.isBlank() && uri.startsWith(contexto))
        {
            uri = uri.substring(contexto.length());
        }
        if (uri == null || uri.isBlank())
        {
            return "/";
        }
        return uri;
    }

    private boolean rotaPublica(String rota)
    {
        return "/".equals(rota)
                || "/index.html".equals(rota)
                || "/error".equals(rota)
                || "/favicon.ico".equals(rota)
                || rota.startsWith("/css/")
                || rota.startsWith("/js/")
                || rota.startsWith("/assets/")
                || rota.startsWith("/images/")
                || "/login/entrar".equals(rota)
                || rota.startsWith("/login/sair")
                || rota.startsWith("/transparencia/listar")
                || rota.startsWith("/transparencia/download/")
                || rota.startsWith("/noticia/listar")
                || rota.startsWith("/noticia/download/")
                || "/doacao/cadastrar".equals(rota)
                || "/doacoes/cadastrar".equals(rota);
    }

    private String categoriaDaSessao(HttpSession session)
    {
        if (session == null)
        {
            return "";
        }
        Object valor = session.getAttribute("categoria");
        if (valor == null)
        {
            return "";
        }
        return normalizar(String.valueOf(valor));
    }

    private boolean podeAcessar(String rota, String categoria)
    {
        if (PAGINAS_SECRETARIA.contains(rota))
        {
            return ehSecretaria(categoria) || ehCoordenador(categoria);
        }
        if (PAGINAS_COORDENADOR_E_SECRETARIA.contains(rota))
        {
            return ehCoordenador(categoria) || ehSecretaria(categoria);
        }
        if (PAGINAS_COORDENADOR.contains(rota))
        {
            return ehCoordenador(categoria);
        }
        if (PAGINAS_CUIDADOR.contains(rota))
        {
            return ehCuidador(categoria);
        }

        String rotaMin = rota.toLowerCase();
        if (rotaMin.startsWith("/login/funcionario/"))
        {
            return true;
        }
        if (rotaMin.startsWith("/login/sessao"))
        {
            return true;
        }
        if (rotaMin.startsWith("/login/"))
        {
            return ehSecretaria(categoria) || ehCoordenador(categoria);
        }
        if (rotaMin.startsWith("/transparencia/"))
        {
            return ehCoordenador(categoria);
        }
        if (rotaMin.startsWith("/noticia/"))
        {
            return ehCoordenador(categoria) || ehSecretaria(categoria);
        }
        if (rotaMin.startsWith("/funcionarioturnos/") || rotaMin.startsWith("/turno/"))
        {
            return ehCoordenador(categoria) || ehCuidador(categoria);
        }
        if (rotaMin.startsWith("/ocorrencia/")
                || rotaMin.startsWith("/registrarusomedicacao/")
                || rotaMin.startsWith("/prescricaodose/"))
        {
            return ehCuidador(categoria) || ehCoordenador(categoria);
        }
        if (rotaMin.startsWith("/funcionario/listarcuidadores"))
        {
            return ehSecretaria(categoria) || ehCoordenador(categoria) || ehCuidador(categoria);
        }
        if (rotaMin.startsWith("/funcionario/")
                || rotaMin.startsWith("/morador/")
                || rotaMin.startsWith("/composicaofamiliar/")
                || rotaMin.startsWith("/historicomorador/")
                || rotaMin.startsWith("/medicamento/")
                || rotaMin.startsWith("/prescricao/")
                || rotaMin.startsWith("/quarto/")
                || rotaMin.startsWith("/tipoocorrencia/")
                || rotaMin.startsWith("/tiposatividades/")
                || rotaMin.startsWith("/atividades/")
                || rotaMin.startsWith("/atividadesmorador/")
                || rotaMin.startsWith("/tiposdespesas/")
                || rotaMin.startsWith("/despesa/")
                || rotaMin.startsWith("/doacao/"))
        {
            return ehSecretaria(categoria) || ehCoordenador(categoria);
        }

        return false;
    }

    private void negarAcesso(HttpServletRequest request, HttpServletResponse response, String mensagem, int status) throws IOException
    {
        if (request.getRequestURI().endsWith(".html"))
        {
            if (status == 401)
            {
                response.sendRedirect(request.getContextPath() + "/login.html");
                return;
            }
            mostrarTelaAcessoNegado(request, response, mensagem, status);
            return;
        }

        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"title\":\"Erro\",\"descricao\":\"" + mensagem + "\"}");
    }

    private void mostrarTelaAcessoNegado(HttpServletRequest request, HttpServletResponse response, String mensagem, int status) throws IOException
    {
        HttpSession session = request.getSession(false);
        if (session != null)
        {
            session.invalidate();
        }

        String loginUrl = request.getContextPath() + "/login.html";
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/html; charset=UTF-8");
        response.getWriter().write("""
                <!doctype html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="refresh" content="3;url=%s">
                    <title>Acesso negado - SGAV</title>
                    <style>
                        :root {
                            color-scheme: light;
                            font-family: Arial, Helvetica, sans-serif;
                            --azul: #123f91;
                            --vermelho: #c93535;
                            --texto: #17233d;
                            --borda: #e3e9f4;
                            --fundo: #f4f7fb;
                        }

                        * {
                            box-sizing: border-box;
                        }

                        body {
                            min-height: 100vh;
                            margin: 0;
                            display: grid;
                            place-items: center;
                            background: var(--fundo);
                            color: var(--texto);
                        }

                        main {
                            width: min(92vw, 480px);
                            padding: 34px;
                            border: 1px solid var(--borda);
                            border-radius: 8px;
                            background: #ffffff;
                            box-shadow: 0 18px 45px rgba(18, 63, 145, 0.12);
                            text-align: center;
                        }

                        .marca {
                            margin: 0 0 18px;
                            color: var(--azul);
                            font-size: 26px;
                            font-weight: 800;
                            letter-spacing: 0;
                        }

                        h1 {
                            margin: 0 0 10px;
                            font-size: 24px;
                        }

                        p {
                            margin: 0 0 22px;
                            color: #5c6f8f;
                            line-height: 1.5;
                        }

                        .alerta {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 52px;
                            height: 52px;
                            margin-bottom: 18px;
                            border-radius: 50%%;
                            background: #fff0f0;
                            color: var(--vermelho);
                            font-size: 30px;
                            font-weight: 700;
                        }

                        a {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 44px;
                            padding: 0 22px;
                            border-radius: 8px;
                            background: var(--azul);
                            color: #ffffff;
                            font-weight: 700;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <div class="marca">SGAV</div>
                        <div class="alerta">!</div>
                        <h1>Acesso negado</h1>
                        <p>%s. Voce sera redirecionado para o login.</p>
                        <a href="%s">Voltar para o login</a>
                    </main>
                    <script>
                        localStorage.clear();
                        window.setTimeout(function () {
                            window.location.replace("%s");
                        }, 3000);
                    </script>
                </body>
                </html>
                """.formatted(loginUrl, mensagem, loginUrl, loginUrl));
    }

    private boolean ehSecretaria(String categoria)
    {
        return "secretaria".equals(categoria);
    }

    private boolean ehCoordenador(String categoria)
    {
        return "coordenador".equals(categoria);
    }

    private boolean ehCuidador(String categoria)
    {
        return "cuidador".equals(categoria);
    }

    private String normalizar(String texto)
    {
        return Normalizer.normalize(String.valueOf(texto), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase();
    }
}
