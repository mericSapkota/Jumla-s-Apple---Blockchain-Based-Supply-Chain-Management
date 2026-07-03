package fyp.scm.auth;

import fyp.scm.security.JwtUtil;
import fyp.scm.storage.FileStorageService;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;
    private final FileStorageService fileStorageService;

    public AuthResponse register(RegisterRequest req, MultipartFile profilePicture) {
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
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getRole().name(), user.getFullName());
    }

    public AuthResponse login(AuthRequest req) {
        // Step 1 — find user first, throw custom message if not found
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step 2 — check password manually, throw custom message if wrong
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Step 3 — generate token
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getRole().name(), user.getFullName());
    }
}
