package unoeste.projetoasilo.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfiguration
{
    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter()
    {
        FilterRegistrationBean<SecurityHeadersFilter> register = new FilterRegistrationBean<>();
        register.setFilter(new SecurityHeadersFilter());
        register.addUrlPatterns("/*");
        register.setOrder(0);
        return register;
    }

    @Bean
    public FilterRegistrationBean<AccessFilter> accessFilter()
    {
        FilterRegistrationBean<AccessFilter> register = new FilterRegistrationBean<>();
        register.setFilter(new AccessFilter());
        register.addUrlPatterns("/*");
        register.setOrder(1);
        return register;
    }
}
