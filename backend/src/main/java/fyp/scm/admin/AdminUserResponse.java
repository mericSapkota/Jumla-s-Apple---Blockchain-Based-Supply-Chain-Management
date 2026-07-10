package fyp.scm.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private LocalDate dateOfBirth;
    private String profilePicturePath;
    private String walletAddress;
    private boolean emailVerified;
    private Instant createdAt;
}
