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
}
