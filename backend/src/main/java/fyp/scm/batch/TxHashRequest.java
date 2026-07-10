package fyp.scm.batch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// Used for actions where the on-chain call itself carries all the data
// (certify, deliver): the frontend already sent the transaction with
// MetaMask, so all the backend needs is the resulting tx hash to verify
// and then re-sync its Postgres copy from the chain.
@Data
public class TxHashRequest {
    @NotBlank(message = "txHash is required")
    private String txHash;
}
