package fyp.scm.batch;


import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

// ─── Full Batch Response (used for GET /api/batch/{id} and dashboards) ────────
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {

    private String batchId;
    private String farmerName;
    private String farmerEmail;
    private String farmLocation;
    private String appleVariety;
    private Long weightKg;
    private LocalDateTime harvestDate;
    private String status;
    private String destination;
    private String ipfsHash;
    private String aiResult;
    private String photoPath;

    // Ethereum transaction hashes — lets consumer verify on Etherscan
    private String txHashCreate;
    private String txHashCertify;
    private String txHashTransit;
    private String txHashDeliver;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Transit checkpoints — populated from blockchain for consumer trace view
    private List<TransitCheckpoint> transitHistory;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransitCheckpoint {
        private String location;
        private Long timestamp;      // Unix timestamp from blockchain
        private String updatedBy;    // wallet address
    }
}