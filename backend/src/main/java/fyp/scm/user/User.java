package fyp.scm.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    // Relative path only, e.g. "/uploads/profiles/<uuid>.jpg".
    // The actual image file lives on the FRONTEND, not the backend —
    // see FileStorageService for where it is physically written.
    private String profilePicturePath;

    // MetaMask wallet linked to this account. Lowercased hex address, unique.
    // This is the address that will actually sign on-chain transactions —
    // see WalletService for how it gets linked and role-assigned.
    @Column(unique = true)
    private String walletAddress;

    // Set once the user clicks the link in their verification email.
    // Login is blocked until this is true — see AuthService.login.
    @Builder.Default
    @Column(nullable = false)
    private boolean emailVerified = false;

    private String verificationToken;

    private Instant verificationTokenExpiry;

    // Nullable for accounts created before this column existed.
    @Builder.Default
    private Instant createdAt = Instant.now();

    // 2FA (superadmin logins only): 6-digit emailed code with expiry and a
    // brute-force attempt counter — see AuthService.verifyTwoFactor.
    private String twoFactorCode;

    private Instant twoFactorCodeExpiry;

    @Builder.Default
    private int twoFactorAttempts = 0;

    // "LOCAL" (email+password) or "GOOGLE" (created via Google sign-in).
    @Builder.Default
    private String authProvider = "LOCAL";

    // ── UserDetails impl ──────────────────────────
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}