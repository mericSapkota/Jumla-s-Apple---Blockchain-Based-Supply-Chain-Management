package fyp.scm.certificate;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One row per successful on-chain transaction a user performs
 * (createBatch, certifyBatch, updateTransit, deliverBatch).
 * Used purely to count a user's confirmed blockchain activity for the
 * "Generate Certificate" feature — independent of which batch it's tied to.
 */
@Entity
@Table(name = "blockchain_transaction_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainTransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String role; // FARMER | COOPERATIVE | TRANSPORTER (CONSUMER never logs)

    @Column(nullable = false)
    private String batchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private String txHash;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum TransactionType {
        CREATE_BATCH,
        CERTIFY_BATCH,
        UPDATE_TRANSIT,
        DELIVER_BATCH
    }
}
