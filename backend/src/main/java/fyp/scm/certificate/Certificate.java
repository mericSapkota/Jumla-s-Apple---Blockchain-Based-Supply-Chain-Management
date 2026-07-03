package fyp.scm.certificate;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String certificateNumber; // e.g. "JML-CERT-2026-A1B2C3"

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private long transactionCountAtIssue;

    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }
}
