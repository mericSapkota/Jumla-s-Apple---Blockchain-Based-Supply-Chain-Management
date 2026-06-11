package fyp.scm.batch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// ─── Transit Update (Transporter) ────────────────────────────────────────────
@Data
public class TransitUpdateRequest {

    @NotBlank(message = "Current location is required")
    private String location;      // e.g. "Nepalgunj"

    private String destination;   // only needed on first transit call
}