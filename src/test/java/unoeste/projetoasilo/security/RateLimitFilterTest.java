package unoeste.projetoasilo.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest
{
    @Test
    void blocksTheThirdLoginAttemptInsideTheConfiguredWindow() throws Exception
    {
        RateLimitFilter filter = new RateLimitFilter(
                new RequestRateLimiter(),
                2,
                Duration.ofMinutes(5),
                2,
                Duration.ofMinutes(5)
        );

        assertEquals(200, sendLoginAttempt(filter).getStatus());
        assertEquals(200, sendLoginAttempt(filter).getStatus());

        MockHttpServletResponse blockedResponse = sendLoginAttempt(filter);
        assertEquals(429, blockedResponse.getStatus());
        assertEquals("300", blockedResponse.getHeader("Retry-After"));
    }

    private MockHttpServletResponse sendLoginAttempt(RateLimitFilter filter) throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/login/entrar");
        request.addHeader("X-Forwarded-For", "203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> { });
        return response;
    }
}
