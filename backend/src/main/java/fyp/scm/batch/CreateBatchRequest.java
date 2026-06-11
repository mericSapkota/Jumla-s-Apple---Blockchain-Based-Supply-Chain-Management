package fyp.scm.batch;


import jakarta.validation.constraints.*;
import lombok.Data;

// ─── Create Batch (Farmer) ────────────────────────────────────────────────────
@Data
public class CreateBatchRequest {

    @NotBlank(message = "Farm location is required")
    private String farmLocation;

    @NotBlank(message = "Apple variety is required")
    private String appleVariety;

    @NotNull(message = "Weight is required")
    @Min(value = 1, message = "Weight must be at least 1 kg")
    private Long weightKg;

    @NotBlank(message = "Harvest date is required")
    private String harvestDate;   // ISO string — "2025-10-12T00:00:00"

    private String ipfsHash;      // optional at creation, updated after photo upload
    private String aiResult;      // "FRESH" | "DAMAGED" | "PENDING"
    private String photoPath;
}



// ─── Update IPFS Hash (Farmer / Backend after photo upload) ──────────────────
