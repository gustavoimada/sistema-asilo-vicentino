package unoeste.projetoasilo.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest
{
    @Test
    void blocksAfterTwoFailedLoginAttemptsInsideTheConfiguredWindow() throws Exception
    {
        RateLimitFilter filter = new RateLimitFilter(
                new RequestRateLimiter(),
                2,
                Duration.ofMinutes(5),
                2,
                Duration.ofMinutes(5)
        );

        assertEquals(401, sendLoginAttempt(filter, 401).getStatus());
        assertEquals(401, sendLoginAttempt(filter, 401).getStatus());

        MockHttpServletResponse blockedResponse = sendLoginAttempt(filter, 200);
        assertEquals(429, blockedResponse.getStatus());
        assertEquals("300", blockedResponse.getHeader("Retry-After"));
    }

    @Test
    void successfulLoginsDoNotConsumeTheFailureLimit() throws Exception
    {
        RateLimitFilter filter = new RateLimitFilter(
                new RequestRateLimiter(),
                2,
                Duration.ofMinutes(5),
                2,
                Duration.ofMinutes(5)
        );

        for (int attempt = 0; attempt < 10; attempt++)
        {
            assertEquals(200, sendLoginAttempt(filter, 200).getStatus());
        }
    }

    @Test
    void successfulLoginClearsPreviousFailures() throws Exception
    {
        RateLimitFilter filter = new RateLimitFilter(
                new RequestRateLimiter(),
                2,
                Duration.ofMinutes(5),
                2,
                Duration.ofMinutes(5)
        );

        assertEquals(401, sendLoginAttempt(filter, 401).getStatus());
        assertEquals(200, sendLoginAttempt(filter, 200).getStatus());
        assertEquals(401, sendLoginAttempt(filter, 401).getStatus());
        assertEquals(200, sendLoginAttempt(filter, 200).getStatus());
    }

    private MockHttpServletResponse sendLoginAttempt(RateLimitFilter filter, int applicationStatus) throws Exception
    {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/login/entrar");
        request.addHeader("X-Forwarded-For", "203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) ->
                ((MockHttpServletResponse) ignoredResponse).setStatus(applicationStatus));
        return response;
    }
}
