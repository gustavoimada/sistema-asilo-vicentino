package unoeste.projetoasilo.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Duration;

/** Limits repeated write attempts on public endpoints before they reach a controller. */
public class RateLimitFilter implements Filter
{
    private static final int DEFAULT_LOGIN_MAXIMUM = 8;
    private static final int DEFAULT_DONATION_MAXIMUM = 6;
    private static final Duration DEFAULT_LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final Duration DEFAULT_DONATION_WINDOW = Duration.ofHours(1);

    private final RequestRateLimiter limiter;
    private final int loginMaximum;
    private final int donationMaximum;
    private final Duration loginWindow;
    private final Duration donationWindow;

    public RateLimitFilter()
    {
        this(
                new RequestRateLimiter(),
                readPositiveInt("LOGIN_RATE_LIMIT_MAX", DEFAULT_LOGIN_MAXIMUM),
                Duration.ofSeconds(readPositiveInt("LOGIN_RATE_LIMIT_WINDOW_SECONDS", (int) DEFAULT_LOGIN_WINDOW.toSeconds())),
                readPositiveInt("DONATION_RATE_LIMIT_MAX", DEFAULT_DONATION_MAXIMUM),
                Duration.ofSeconds(readPositiveInt("DONATION_RATE_LIMIT_WINDOW_SECONDS", (int) DEFAULT_DONATION_WINDOW.toSeconds()))
        );
    }

    RateLimitFilter(RequestRateLimiter limiter, int loginMaximum, Duration loginWindow, int donationMaximum, Duration donationWindow)
    {
        this.limiter = limiter;
        this.loginMaximum = loginMaximum;
        this.loginWindow = loginWindow;
        this.donationMaximum = donationMaximum;
        this.donationWindow = donationWindow;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException
    {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String route = routeWithoutContext(request);

        if ("POST".equalsIgnoreCase(request.getMethod()) && "/login/entrar".equals(route))
        {
            String loginKey = "login:" + clientIdentifier(request);
            if (limiter.isBlocked(loginKey, loginMaximum, loginWindow))
            {
                reject(response, loginWindow);
                return;
            }

            filterChain.doFilter(servletRequest, servletResponse);
            if (response.getStatus() == HttpServletResponse.SC_UNAUTHORIZED)
            {
                limiter.registerFailure(loginKey, loginWindow);
            }
            else if (response.getStatus() >= 200 && response.getStatus() < 300)
            {
                limiter.reset(loginKey);
            }
            return;
        }
        else if ("POST".equalsIgnoreCase(request.getMethod()) && isPublicDonation(route, request))
        {
            if (!limiter.allow("donation:" + clientIdentifier(request), donationMaximum, donationWindow))
            {
                reject(response, donationWindow);
                return;
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }

    private boolean isPublicDonation(String route, HttpServletRequest request)
    {
        return ("/doacao/cadastrar".equals(route) || "/doacoes/cadastrar".equals(route))
                && request.getSession(false) == null;
    }

    private String routeWithoutContext(HttpServletRequest request)
    {
        String route = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isBlank() && route.startsWith(contextPath))
        {
            route = route.substring(contextPath.length());
        }
        return route == null || route.isBlank() ? "/" : route;
    }

    private String clientIdentifier(HttpServletRequest request)
    {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank())
        {
            String candidate = forwardedFor.split(",", 2)[0].trim();
            if (candidate.matches("[0-9a-fA-F:.]{3,64}"))
            {
                return candidate;
            }
        }

        String remoteAddress = request.getRemoteAddr();
        return remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress;
    }

    private void reject(HttpServletResponse response, Duration window) throws IOException
    {
        response.setStatus(429);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(window.toSeconds()));
        response.getWriter().write("{\"title\":\"Muitas tentativas\",\"descricao\":\"Aguarde alguns minutos antes de tentar novamente.\"}");
    }

    private static int readPositiveInt(String name, int defaultValue)
    {
        String value = System.getenv(name);
        if (value == null || value.isBlank())
        {
            value = System.getProperty(name);
        }

        try
        {
            int parsed = Integer.parseInt(value);
            return parsed > 0 ? parsed : defaultValue;
        }
        catch (Exception ignored)
        {
            return defaultValue;
        }
    }
}
