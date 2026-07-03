package fyp.scm.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getProfile(user.getEmail()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(user.getEmail(), request));
    }

    // Update/replace the profile picture after registration.
    // multipart/form-data, field name "profilePicture".
    @PutMapping(value = "/me/photo", consumes = "multipart/form-data")
    public ResponseEntity<UserResponse> updateProfilePicture(
            @AuthenticationPrincipal User user,
            @RequestPart("profilePicture") MultipartFile profilePicture) {
        return ResponseEntity.ok(userService.updateProfilePicture(user.getEmail(), profilePicture));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(user.getEmail(), request);
        return ResponseEntity.noContent().build();
    }
}