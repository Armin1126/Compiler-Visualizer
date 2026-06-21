package com.compiler.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Allowed CORS origin(s) — override in application.properties or via env var.
     * Defaults to the production Vercel URL when the property is absent.
     */
    @Value("${cors.allowed-origins:https://compilervisualizer.vercel.app}")
    private String[] allowedOrigins;

    // -----------------------------------------------------------------------
    // Security filter chain
    // -----------------------------------------------------------------------
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Stateless REST API — no session, no CSRF token needed
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())

            // Delegate CORS to the bean below (replaces @CrossOrigin on the controller)
            .cors(withDefaults())

            // All API endpoints are public — no authentication required
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())

            // ---------------------------------------------------------------
            // HTTP Security Headers
            // ---------------------------------------------------------------
            .headers(headers -> headers
                // Prevent MIME-type sniffing
                .contentTypeOptions(withDefaults())

                // Forbid this API from being framed (clickjacking protection)
                .frameOptions(frame -> frame.deny())

                // HTTP Strict Transport Security — 1 year, include subdomains
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31_536_000))

                // Referrer Policy — limit referrer info sent on cross-origin requests
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers
                        .ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))

                // Content Security Policy — this is a pure API, block everything
                // except the same origin; adjust if you ever serve HTML from the backend
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives(
                        "default-src 'none'; " +
                        "frame-ancestors 'none'"))

                // Permissions Policy — disable browser features the API will never use
                .permissionsPolicy(pp -> pp
                    .policy("geolocation=(), camera=(), microphone=(), " +
                            "payment=(), usb=(), interest-cohort=()"))
            );

        return http.build();
    }

    // -----------------------------------------------------------------------
    // CORS configuration (replaces @CrossOrigin on CompilerController)
    // -----------------------------------------------------------------------
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins));
        config.setAllowedMethods(List.of("POST", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type"));
        config.setMaxAge(3600L); // cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
