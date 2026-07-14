package unoeste.projetoasilo.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityHeadersFilterTest
{
    @Test
    void addsSecurityHeadersAndHstsBehindHttpsProxy() throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/index.html");
        request.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean[] chainCalled = {false};

        new SecurityHeadersFilter().doFilter(request, response, (ignoredRequest, ignoredResponse) -> chainCalled[0] = true);

        assertEquals("nosniff", response.getHeader("X-Content-Type-Options"));
        assertEquals("SAMEORIGIN", response.getHeader("X-Frame-Options"));
        assertTrue(response.getHeader("Content-Security-Policy").contains("default-src 'self'"));
        assertTrue(response.getHeader("Content-Security-Policy").contains("connect-src 'self' https://viacep.com.br"));
        assertEquals("max-age=31536000; includeSubDomains", response.getHeader("Strict-Transport-Security"));
        assertTrue(chainCalled[0]);
    }
}
