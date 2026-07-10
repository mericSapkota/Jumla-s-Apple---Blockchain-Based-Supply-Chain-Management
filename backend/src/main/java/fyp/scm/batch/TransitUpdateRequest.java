package fyp.scm.batch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// ─── Transit Update (Transporter) ────────────────────────────────────────────
// The transporter's wallet already sent updateTransit() on-chain. Location /
// destination are read back from the chain (getBatch + getTransitHistory),
// not trusted from the request — the tx hash is all that's needed here.
@Data
public class TransitUpdateRequest {

    @NotBlank(message = "Transaction hash is required")
    private String txHash;
}
