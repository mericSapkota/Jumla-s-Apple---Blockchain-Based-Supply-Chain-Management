package fyp.scm.user;

// adjust to your actual package/class name
import fyp.scm.security.JwtUtil;
import fyp.scm.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final FileStorageService fileStorageService;

    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toResponse(user, null);
    }

    @Transactional
    public UserResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean emailChanged = !user.getEmail().equalsIgnoreCase(request.getEmail());

        if (emailChanged) {
            userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                throw new IllegalArgumentException("Email already in use");
            });
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        userRepository.save(user);

        // Email is the JWT subject (getUsername() returns email), so a changed
        // email invalidates the old token's subject. Issue a fresh one immediately
        // so the frontend doesn't get logged out mid-session.
        String newToken = emailChanged ? jwtUtil.generateToken(user) : null;

        return toResponse(user, newToken);
    }

    @Transactional
    public UserResponse updateProfilePicture(String email, MultipartFile profilePicture) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldPath = user.getProfilePicturePath();
        String newPath = fileStorageService.storeProfilePicture(profilePicture);
        user.setProfilePicturePath(newPath);
        userRepository.save(user);

        // best-effort cleanup of the old file now that DB points at the new one
        fileStorageService.deleteProfilePicture(oldPath);

        return toResponse(user, null);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserResponse toResponse(User user, String token) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .dateOfBirth(user.getDateOfBirth())
                .profilePicturePath(user.getProfilePicturePath())
                .token(token)
                .build();
    }
}
