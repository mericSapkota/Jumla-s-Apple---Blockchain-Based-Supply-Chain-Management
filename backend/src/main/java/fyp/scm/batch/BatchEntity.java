package fyp.scm.batch;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String batchId;              // e.g. "JML-2025-0042" — also used as on-chain key

    @Column(nullable = false)
    private String farmerEmail;          // links to User table

    @Column(nullable = false)
    private String farmerName;

    @Column(nullable = false)
    private String farmLocation;

    @Column(nullable = false)
    private String appleVariety;

    @Column(nullable = false)
    private Long weightKg;

    @Column(nullable = false)
    private LocalDateTime harvestDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BatchStatus status;

    private String photoPath;            // local file path or S3 URL of uploaded apple photo

    private String aiResult;             // "FRESH" | "DAMAGED" | "PENDING"

    private String ipfsHash;             // IPFS CID — updated after photo upload

    private String destination;          // filled when transporter picks up

    private String txHashCreate;         // Ethereum tx hash of createBatch()
    private String txHashCertify;        // Ethereum tx hash of certifyBatch()
    private String txHashTransit;        // Ethereum tx hash of first updateTransit()
    private String txHashDeliver;        // Ethereum tx hash of deliverBatch()

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = BatchStatus.HARVESTED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}