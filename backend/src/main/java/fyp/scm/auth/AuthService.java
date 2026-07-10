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

import java.security.SecureRandom;
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
    private final GoogleTokenVerifier googleTokenVerifier;

    private static final SecureRandom RANDOM = new SecureRandom();

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
        return AuthResponse.builder()
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .message("Registration successful. Please check your email to verify your account.")
                .build();
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

        // Step 4 — superadmin logins require a second factor: email a 6-digit
        // code and hold the JWT until /verify-2fa succeeds.
        if (user.getRole() == fyp.scm.user.Role.SUPERADMIN) {
            String code = String.format("%06d", RANDOM.nextInt(1_000_000));
            user.setTwoFactorCode(code);
            user.setTwoFactorCodeExpiry(Instant.now().plus(5, ChronoUnit.MINUTES));
            user.setTwoFactorAttempts(0);
            userRepository.save(user);
            mailService.sendTwoFactorCode(user.getEmail(), user.getFullName(), code);
            return AuthResponse.builder()
                    .role(user.getRole().name())
                    .fullName(user.getFullName())
                    .twoFactorRequired(true)
                    .message("A verification code has been sent to your email.")
                    .build();
        }

        // Step 5 — generate token
        return tokenResponse(user);
    }

    public AuthResponse verifyTwoFactor(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTwoFactorCode() == null || user.getTwoFactorCodeExpiry() == null) {
            throw new RuntimeException("No pending verification code. Please log in again.");
        }
        if (user.getTwoFactorCodeExpiry().isBefore(Instant.now())) {
            clearTwoFactor(user);
            throw new RuntimeException("The code has expired. Please log in again.");
        }
        if (user.getTwoFactorAttempts() >= 5) {
            clearTwoFactor(user);
            throw new RuntimeException("Too many attempts. Please log in again.");
        }
        if (!user.getTwoFactorCode().equals(code)) {
            user.setTwoFactorAttempts(user.getTwoFactorAttempts() + 1);
            userRepository.save(user);
            throw new RuntimeException("Incorrect code.");
        }

        clearTwoFactor(user);
        return tokenResponse(user);
    }

    public AuthResponse googleAuth(GoogleAuthRequest req) {
        GoogleTokenVerifier.GoogleUser googleUser = googleTokenVerifier.verify(req.getCredential());

        User existing = userRepository.findByEmail(googleUser.email()).orElse(null);
        if (existing != null) {
            // Google has proven ownership of this mailbox — treat as verified.
            if (!existing.isEmailVerified()) {
                existing.setEmailVerified(true);
                existing.setVerificationToken(null);
                existing.setVerificationTokenExpiry(null);
                userRepository.save(existing);
            }
            return tokenResponse(existing);
        }

        // Brand-new email: we need a role and date of birth before creating
        // the account — tell the frontend to collect them and retry.
        if (req.getRole() == null || req.getDateOfBirth() == null) {
            return AuthResponse.builder()
                    .fullName(googleUser.fullName())
                    .needsProfile(true)
                    .message("Choose a role and date of birth to finish creating your account.")
                    .build();
        }
        if (req.getRole() == fyp.scm.user.Role.SUPERADMIN) {
            throw new RuntimeException("This role cannot be self-registered");
        }

        User user = User.builder()
                .email(googleUser.email())
                // Random password: Google accounts authenticate via Google only.
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(googleUser.fullName())
                .role(req.getRole())
                .dateOfBirth(req.getDateOfBirth())
                .emailVerified(true)
                .authProvider("GOOGLE")
                .build();
        userRepository.save(user);
        return tokenResponse(user);
    }

    private void clearTwoFactor(User user) {
        user.setTwoFactorCode(null);
        user.setTwoFactorCodeExpiry(null);
        user.setTwoFactorAttempts(0);
        userRepository.save(user);
    }

    private AuthResponse tokenResponse(User user) {
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user))
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
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
