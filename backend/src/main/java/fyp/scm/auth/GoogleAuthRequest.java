package fyp.scm.auth;

import fyp.scm.user.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GoogleAuthRequest {
    @NotBlank
    private String credential;
    // Only needed when the Google email has no account yet (needsProfile flow).
    private Role role;
    private LocalDate dateOfBirth;
}
