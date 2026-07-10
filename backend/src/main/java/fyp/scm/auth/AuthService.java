package fyp.scm.auth;

import fyp.scm.mail.MailService;
import fyp.scm.security.JwtUtil;
import fyp.scm.storage.FileStorageService;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;
    private final FileStorageService fileStorageService;
    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.verification.token-expiry-hours}")
    private long verificationTokenExpiryHours;

    public AuthResponse register(RegisterRequest req, MultipartFile profilePicture) {
        if (req.getRole() == fyp.scm.user.Role.SUPERADMIN) {
            throw new RuntimeException("This role cannot be self-registered");
        }
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Profile picture is optional at registration — store it on the
        // frontend's public/uploads/profiles directory if provided, and only
        // keep the relative path in the database.
        String profilePicturePath = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePicturePath = fileStorageService.storeProfilePicture(profilePicture);
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(req.getRole())
                .dateOfBirth(req.getDateOfBirth())
                .profilePicturePath(profilePicturePath)
                .emailVerified(false)
                .verificationToken(UUID.randomUUID().toString())
                .verificationTokenExpiry(Instant.now().plus(verificationTokenExpiryHours, ChronoUnit.HOURS))
                .build();
        userRepository.save(user);

        sendVerificationEmail(user);

        // No JWT issued yet — the account isn't usable until the email is verified.
        return new AuthResponse(null, user.getRole().name(), user.getFullName(),
                "Registration successful. Please check your email to verify your account.");
    }

    public AuthResponse login(AuthRequest req) {
        // Step 1 — find user first, throw custom message if not found
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step 2 — check password manually, throw custom message if wrong
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Step 3 — block unverified accounts
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in.");
        }

        // Step 4 — generate token
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getRole().name(), user.getFullName(), null);
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification link"));

        if (user.getVerificationTokenExpiry() == null || user.getVerificationTokenExpiry().isBefore(Instant.now())) {
            throw new RuntimeException("This verification link has expired. Please request a new one.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
    }

    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("This account is already verified.");
        }

        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationTokenExpiry(Instant.now().plus(verificationTokenExpiryHours, ChronoUnit.HOURS));
        userRepository.save(user);

        sendVerificationEmail(user);
    }

    private void sendVerificationEmail(User user) {
        String link = frontendUrl + "/verify-email?token=" + user.getVerificationToken();
        mailService.sendVerificationEmail(user.getEmail(), user.getFullName(), link);
    }
}
