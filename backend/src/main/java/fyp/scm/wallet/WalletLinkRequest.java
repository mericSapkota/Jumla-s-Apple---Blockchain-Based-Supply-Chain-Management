package fyp.scm.wallet;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// The frontend has MetaMask sign a human-readable message (see WalletService
// for the exact format/expiry rules it must follow) and sends the three
// pieces here so the backend can recover the signing address and prove the
// logged-in user actually controls that wallet.
@Data
public class WalletLinkRequest {

    @NotBlank
    private String walletAddress;

    @NotBlank
    private String message;

    @NotBlank
    private String signature;
}
