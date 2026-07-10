package fyp.scm.wallet;

import fyp.scm.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.Map;

@RestController
@RequestMapping("/api/users/me/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    // Link (or re-link, if the same wallet) a MetaMask address to the
    // logged-in account. Also auto-assigns the matching on-chain role.
    @PostMapping
    public ResponseEntity<WalletLinkResponse> linkWallet(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WalletLinkRequest req) {
        return ResponseEntity.ok(walletService.linkWallet(user.getEmail(), req));
    }

    // Retry on-chain role assignment for the already-linked wallet (useful
    // if the first assignRole call failed, e.g. RPC hiccup).
    @PostMapping("/retry-role")
    public ResponseEntity<WalletLinkResponse> retryRoleAssignment(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.retryRoleAssignment(user.getEmail()));
    }

    // Quick status check: linked address + what role the chain currently
    // has recorded for it (0=NONE..4=CONSUMER), so the frontend can warn the
    // user before they try (and fail) a transaction.
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> walletStatus(@AuthenticationPrincipal User user) {
        String wallet = user.getWalletAddress();
        BigInteger onChainRole = wallet != null ? walletService.getOnChainRole(wallet) : BigInteger.ZERO;
        return ResponseEntity.ok(Map.of(
                "walletAddress", wallet == null ? "" : wallet,
                "linked", wallet != null,
                "onChainRole", onChainRole,
                "offChainRole", user.getRole().name()
        ));
    }
}
