package fyp.scm.auth;

import fyp.scm.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;
    @Email
    private String email;
    @NotBlank private String password;
    @NotNull
    private Role role;
}