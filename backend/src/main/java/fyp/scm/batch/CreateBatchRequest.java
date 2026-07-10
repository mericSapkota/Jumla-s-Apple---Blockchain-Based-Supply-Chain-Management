package fyp.scm.batch;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// ─── Create Batch (Farmer) ────────────────────────────────────────────────────
// The farmer's own MetaMask wallet has already sent createBatch() on-chain
// by the time this hits the backend. The backend does NOT trust any batch
// fields from the client — it re-reads the authoritative data straight off
// the contract using batchId, and only persists what isn't stored on-chain
// (photoPath). See BatchService.createBatch().
@Data
public class CreateBatchRequest {

    @NotBlank(message = "Batch ID is required")
    private String batchId;        // must match the ID used in the on-chain createBatch() call

    @NotBlank(message = "Transaction hash is required")
    private String txHash;         // hash of the confirmed createBatch() transaction

    private String photoPath;      // off-chain only — apple photo, not stored on contract
}
