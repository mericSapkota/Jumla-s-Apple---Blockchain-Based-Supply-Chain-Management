package fyp.scm.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private LocalDate dateOfBirth;
    private String profilePicturePath; // relative path only, e.g. "/uploads/profiles/abc.jpg"
    private String token; // only populated when a new token was issued (email change)
    private String walletAddress; // linked MetaMask wallet, null if not connected yet
}
