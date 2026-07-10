package fyp.scm.config;

import fyp.scm.user.Role;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }
        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .fullName("Super Admin")
                .role(Role.SUPERADMIN)
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .emailVerified(true)
                .build();
        userRepository.save(admin);
        log.warn("Seeded SUPERADMIN account {} — change the default password via the ADMIN_PASSWORD env var!", adminEmail);
    }
}
