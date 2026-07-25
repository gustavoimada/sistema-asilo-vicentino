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
    void allowsPublicTransparencyListingWithoutSession() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/transparencia/listar");
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
    void allowsSecretaryAndCoordinatorToUseDiaperControl() throws Exception
    {
        String[][] requests = {
                {"GET", "/controle-fraldas/resumo", "Secretaria"},
                {"POST", "/controle-fraldas", "Coordenador"}
        };

        for (String[] requestData : requests)
        {
            MockHttpServletRequest request = new MockHttpServletRequest(requestData[0], requestData[1]);
            request.getSession(true).setAttribute("categoria", requestData[2]);
            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean[] chainCalled = {false};

            new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

            assertEquals(200, response.getStatus());
            assertEquals(true, chainCalled[0]);
        }
    }

    @Test
    void blocksCaregiverFromDiaperControl() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/controle-fraldas/resumo");
        request.getSession(true).setAttribute("categoria", "Cuidador");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("Caregivers must not access the diaper purchase control");
        });

        assertEquals(403, response.getStatus());
    }

    @Test
    void allowsOnlyCoordinatorToOpenDiaperReportPage() throws Exception
    {
        MockHttpServletRequest coordinatorRequest = new MockHttpServletRequest("GET", "/relatorioFraldas.html");
        coordinatorRequest.getSession(true).setAttribute("categoria", "Coordenador");
        MockHttpServletResponse coordinatorResponse = new MockHttpServletResponse();
        boolean[] chainCalled = {false};

        new AccessFilter().doFilter(coordinatorRequest, coordinatorResponse,
                (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

        assertEquals(200, coordinatorResponse.getStatus());
        assertEquals(true, chainCalled[0]);

        MockHttpServletRequest secretaryRequest = new MockHttpServletRequest("GET", "/relatorioFraldas.html");
        secretaryRequest.getSession(true).setAttribute("categoria", "Secretaria");
        MockHttpServletResponse secretaryResponse = new MockHttpServletResponse();

        new AccessFilter().doFilter(secretaryRequest, secretaryResponse, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("Secretaries must not open coordinator report pages");
        });

        assertEquals(403, secretaryResponse.getStatus());
    }

    @Test
    void allowsSecretaryAndCoordinatorToManageTransparency() throws Exception
    {
        String[][] requests = {
                {"GET", "/transparencia.html", "Secretaria"},
                {"POST", "/transparencia/upload", "Coordenador"}
        };

        for (String[] requestData : requests)
        {
            MockHttpServletRequest request = new MockHttpServletRequest(requestData[0], requestData[1]);
            request.getSession(true).setAttribute("categoria", requestData[2]);
            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean[] chainCalled = {false};

            new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

            assertEquals(200, response.getStatus());
            assertEquals(true, chainCalled[0]);
        }
    }

    @Test
    void blocksCaregiverFromTransparencyManagement() throws Exception
    {
        for (String rota : new String[]{"/transparencia.html", "/transparencia/upload"})
        {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", rota);
            request.getSession(true).setAttribute("categoria", "Cuidador");
            MockHttpServletResponse response = new MockHttpServletResponse();

            new AccessFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
                throw new AssertionError("Caregivers must not manage transparency documents");
            });

            assertEquals(403, response.getStatus());
        }
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
