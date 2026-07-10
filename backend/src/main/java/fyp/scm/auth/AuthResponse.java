package fyp.scm.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String fullName;
    private String message;
    // Superadmin password login: a 6-digit code was emailed; call /verify-2fa.
    private boolean twoFactorRequired;
    // Google sign-in with an unknown email: collect role + dateOfBirth, retry.
    private boolean needsProfile;
}