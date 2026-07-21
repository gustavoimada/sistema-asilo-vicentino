package unoeste.projetoasilo.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class AccessFilterTest
{
    @Test
    void blocksAdministrativeApiWithoutAnActiveSession() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/funcionario/listar");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("The protected request should not reach the next filter");
        });

        assertEquals(401, response.getStatus());
        assertFalse(response.getContentAsString().isBlank());
    }

    @Test
    void allowsPublicNewsEndpointWithoutSession() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/noticia/listar");
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean[] chainCalled = {false};

        new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

        assertEquals(200, response.getStatus());
        assertEquals(true, chainCalled[0]);
    }

    @Test
    void allowsSearchEngineDiscoveryFilesWithoutSession() throws Exception
    {
        for (String rota : new String[]{"/robots.txt", "/sitemap.xml"})
        {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", rota);
            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean[] chainCalled = {false};

            new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

            assertEquals(200, response.getStatus());
            assertEquals(true, chainCalled[0]);
        }
    }

    @Test
    void allowsActivityProfessionalOnActivitiesAndTypePages() throws Exception
    {
        for (String rota : new String[]{"/atividades.html", "/tipoAtividades.html"})
        {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", rota);
            request.getSession(true).setAttribute("categoria", "Educador_Fisico");
            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean[] chainCalled = {false};

            new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

            assertEquals(200, response.getStatus());
            assertEquals(true, chainCalled[0]);
        }
    }

    @Test
    void blocksActivityProfessionalFromEmployeePage() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/funcionario.html");
        request.getSession(true).setAttribute("categoria", "Fisioterapeuta");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("The protected request should not reach the next filter");
        });

        assertEquals(403, response.getStatus());
    }

    @Test
    void allowsActivityProfessionalToCreateActivityAndTypesButNotEditTypes() throws Exception
    {
        MockHttpServletRequest criarAtividade = new MockHttpServletRequest("POST", "/atividades/cadastrar");
        criarAtividade.getSession(true).setAttribute("categoria", "Artesao");
        MockHttpServletResponse respostaAtividade = new MockHttpServletResponse();
        boolean[] atividadeChamouCadeia = {false};

        new AccessFilter().doFilter(criarAtividade, respostaAtividade, (ignoredRequest, ignoredResponse) -> atividadeChamouCadeia[0] = true);

        assertEquals(200, respostaAtividade.getStatus());
        assertEquals(true, atividadeChamouCadeia[0]);

        MockHttpServletRequest criarTipo = new MockHttpServletRequest("POST", "/tipoatividades/cadastrar");
        criarTipo.getSession(true).setAttribute("categoria", "Artesao");
        MockHttpServletResponse respostaTipo = new MockHttpServletResponse();
        boolean[] tipoChamouCadeia = {false};

        new AccessFilter().doFilter(criarTipo, respostaTipo, (ignoredRequest, ignoredResponse) -> tipoChamouCadeia[0] = true);

        assertEquals(200, respostaTipo.getStatus());
        assertEquals(true, tipoChamouCadeia[0]);

        MockHttpServletRequest editarTipo = new MockHttpServletRequest("PUT", "/tipoatividades/editar");
        editarTipo.getSession(true).setAttribute("categoria", "Artesao");
        MockHttpServletResponse respostaEdicaoTipo = new MockHttpServletResponse();

        new AccessFilter().doFilter(editarTipo, respostaEdicaoTipo, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("The protected request should not reach the next filter");
        });

        assertEquals(403, respostaEdicaoTipo.getStatus());
    }
}
