package fyp.scm.batch;


import jakarta.validation.constraints.*;
import lombok.Data;

// ─── Create Batch (Farmer) ────────────────────────────────────────────────────
@Data
class CreateBatchRequest {

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

// ─── Transit Update (Transporter) ────────────────────────────────────────────
@Data
class TransitUpdateRequest {

    @NotBlank(message = "Current location is required")
    private String location;      // e.g. "Nepalgunj"

    private String destination;   // only needed on first transit call
}

// ─── Update IPFS Hash (Farmer / Backend after photo upload) ──────────────────
@Data
class IpfsUpdateRequest {

    @NotBlank(message = "IPFS hash is required")
    private String ipfsHash;

    private String aiResult;
}