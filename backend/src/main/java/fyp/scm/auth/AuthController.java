package fyp.scm.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Registration is multipart so the profile picture can be uploaded in the
    // same request. The frontend sends:
    //   FormData: "data" -> JSON blob of RegisterRequest, "profilePicture" -> File (optional)
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> register(
            @RequestPart("data") @Valid RegisterRequest req,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        return ResponseEntity.ok(authService.register(req, profilePicture));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
