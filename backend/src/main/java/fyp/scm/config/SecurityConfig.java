package fyp.scm.config;

import fyp.scm.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // Comma-separated list, e.g. "http://localhost:5173,http://localhost:5175"
    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/donations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/batch/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/batch/qr/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blogs", "/api/blogs/*").permitAll()
                        // Public AI chat widget (send message, check enabled, load own history)
                        .requestMatchers("/api/chat/**").permitAll()
                        // Role protected endpoints
                        .requestMatchers("/api/admin/**").hasRole("SUPERADMIN")
                        .requestMatchers("/api/batch/create", "/api/batch/next-id", "/api/batch/photo").hasRole("FARMER")
                        .requestMatchers("/api/batch/certify/**").hasRole("COOPERATIVE")
                        .requestMatchers("/api/batch/transit/**").hasRole("TRANSPORTER")
                        .requestMatchers("/api/batch/deliver/**").hasRole("TRANSPORTER")
                        .requestMatchers("/api/batch/transit/**").hasRole("TRANSPORTER")
                        .requestMatchers("/api/batch/ipfs/**").hasRole("FARMER")
                        .requestMatchers("/api/batch/my/**").authenticated()
                        .requestMatchers("/api/batch/status/**").authenticated()

                        .requestMatchers("/api/users/me", "/api/users/me/password", "/api/users/me/photo").authenticated()
                        .requestMatchers("/api/users/me/wallet/**").authenticated()
                        .requestMatchers("/api/certificate/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/blogs/my").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/blogs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/blogs/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/blogs/*").authenticated()
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {

        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}