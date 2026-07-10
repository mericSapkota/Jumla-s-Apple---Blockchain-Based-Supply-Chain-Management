package fyp.scm.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorRequest {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String code;
}
