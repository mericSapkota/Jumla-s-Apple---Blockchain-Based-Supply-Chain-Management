package fyp.scm.wallet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalletLinkResponse {
    private String walletAddress;
    private String role;               // off-chain role, e.g. "FARMER"
    private String roleAssignTxHash;   // tx hash of the assignRole() call, null if it failed
    private boolean roleAssignedOnChain;
    private String warning;            // set if wallet linked but on-chain role assignment failed
}
