package fyp.scm.wallet;

import fyp.scm.contract.AppleBatch;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final Web3j web3j;
    // Signs assignRole with the deployer/owner key AND the configured chain id
    // (EIP-155), so the transaction is accepted by public RPCs like Sepolia's.
    private final TransactionManager txManager;
    private final ContractGasProvider gasProvider;

    @Value("${web3j.contract-address}")
    private String contractAddress;

    // The message MetaMask signs must match this shape exactly (see
    // buildExpectedMessagePrefix). This is a lightweight replacement for a
    // server-issued nonce: it binds the signature to this account and to a
    // short validity window, so a captured signature can't be replayed later
    // or against a different account.
    private static final Pattern MESSAGE_PATTERN =
            Pattern.compile("Email: (.+)\\nTimestamp: (\\d+)");
    private static final long MESSAGE_MAX_AGE_MINUTES = 10;

    @Transactional
    public WalletLinkResponse linkWallet(String userEmail, WalletLinkRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String claimedAddress = normalizeAddress(req.getWalletAddress());

        // 1) Validate the message shape/freshness/binding to this account.
        validateMessage(req.getMessage(), userEmail);

        // 2) Recover the address that actually produced the signature and
        //    make sure it matches what the client claims it is.
        String recoveredAddress = recoverAddress(req.getMessage(), req.getSignature());
        if (!recoveredAddress.equalsIgnoreCase(claimedAddress)) {
            throw new RuntimeException("Signature does not match the provided wallet address");
        }

        // 3) A wallet can only be linked to one account.
        userRepository.findByWalletAddress(claimedAddress).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new RuntimeException("This wallet is already linked to another account");
            }
        });

        user.setWalletAddress(claimedAddress);
        userRepository.save(user);

        // 4) Auto-assign the on-chain role for this wallet, signed by the
        //    contract owner (the backend's deployer key). This is the ONLY
        //    contract call the backend still signs itself — every batch
        //    action from here on is signed by the user's own wallet.
        BigInteger onChainRole = BigInteger.valueOf(roleToContractValue(user.getRole()));
        try {
            AppleBatch contract = AppleBatch.load(contractAddress, web3j, txManager, gasProvider);
            TransactionReceipt receipt = contract.assignRole(claimedAddress, onChainRole).send();
            log.info("Assigned role {} to wallet {} for user {}. TxHash: {}",
                    user.getRole(), claimedAddress, userEmail, receipt.getTransactionHash());

            return WalletLinkResponse.builder()
                    .walletAddress(claimedAddress)
                    .role(user.getRole().name())
                    .roleAssignTxHash(receipt.getTransactionHash())
                    .roleAssignedOnChain(true)
                    .build();
        } catch (Exception e) {
            // Wallet is linked either way, but flag the failure clearly —
            // the user's contract calls will keep failing with "Wrong role"
            // until an admin retries the assignment.
            log.error("Failed to assign on-chain role for wallet {}: {}", claimedAddress, e.getMessage());
            return WalletLinkResponse.builder()
                    .walletAddress(claimedAddress)
                    .role(user.getRole().name())
                    .roleAssignedOnChain(false)
                    .warning("Wallet linked, but the on-chain role assignment failed: " + e.getMessage()
                            + ". Contact an admin to retry, or actions will fail with 'Wrong role'.")
                    .build();
        }
    }

    /** Re-attempts on-chain role assignment for the currently linked wallet. */
    @Transactional(readOnly = true)
    public WalletLinkResponse retryRoleAssignment(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getWalletAddress() == null) {
            throw new RuntimeException("No wallet linked yet");
        }
        BigInteger onChainRole = BigInteger.valueOf(roleToContractValue(user.getRole()));
        try {
            AppleBatch contract = AppleBatch.load(contractAddress, web3j, txManager, gasProvider);
            TransactionReceipt receipt = contract.assignRole(user.getWalletAddress(), onChainRole).send();
            return WalletLinkResponse.builder()
                    .walletAddress(user.getWalletAddress())
                    .role(user.getRole().name())
                    .roleAssignTxHash(receipt.getTransactionHash())
                    .roleAssignedOnChain(true)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Role assignment failed: " + e.getMessage());
        }
    }

    /**
     * Unlinks the wallet from the account so a different MetaMask account can be
     * linked. Only clears the off-chain association in our DB — the on-chain role
     * already assigned to the old wallet address is left as-is (it's harmless once
     * the address is no longer tied to this account, and re-linking a new wallet
     * assigns that wallet its own role).
     */
    @Transactional
    public void unlinkWallet(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getWalletAddress() == null) {
            throw new RuntimeException("No wallet linked");
        }
        user.setWalletAddress(null);
        userRepository.save(user);
    }

    /** Reads the on-chain role currently assigned to a wallet (0=NONE..4=CONSUMER). */
    public BigInteger getOnChainRole(String walletAddress) {
        try {
            AppleBatch contract = AppleBatch.load(contractAddress, web3j, txManager, gasProvider);
            return contract.roles(walletAddress).send();
        } catch (Exception e) {
            log.warn("Could not read on-chain role for {}: {}", walletAddress, e.getMessage());
            return BigInteger.ZERO;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────

    private void validateMessage(String message, String expectedEmail) {
        Matcher m = MESSAGE_PATTERN.matcher(message);
        if (!m.find()) {
            throw new RuntimeException("Malformed signing message");
        }
        String email = m.group(1).trim();
        long timestampMillis = Long.parseLong(m.group(2).trim());

        if (!email.equalsIgnoreCase(expectedEmail)) {
            throw new RuntimeException("Signed message does not match your account");
        }

        Instant signedAt = Instant.ofEpochMilli(timestampMillis);
        if (signedAt.isBefore(Instant.now().minus(MESSAGE_MAX_AGE_MINUTES, ChronoUnit.MINUTES))
                || signedAt.isAfter(Instant.now().plus(1, ChronoUnit.MINUTES))) {
            throw new RuntimeException("Signature has expired — please try connecting your wallet again");
        }
    }

    /** Recovers the wallet address that produced an EIP-191 personal_sign signature. */
    private String recoverAddress(String message, String signatureHex) {
        byte[] signatureBytes = Numeric.hexStringToByteArray(signatureHex);
        if (signatureBytes.length != 65) {
            throw new RuntimeException("Invalid signature length");
        }

        byte v = signatureBytes[64];
        if (v < 27) {
            v += 27;
        }
        byte[] r = Arrays.copyOfRange(signatureBytes, 0, 32);
        byte[] s = Arrays.copyOfRange(signatureBytes, 32, 64);
        Sign.SignatureData signatureData = new Sign.SignatureData(v, r, s);

        try {
            BigInteger publicKey = Sign.signedPrefixedMessageToKey(
                    message.getBytes(StandardCharsets.UTF_8), signatureData);
            return "0x" + Keys.getAddress(publicKey);
        } catch (Exception e) {
            throw new RuntimeException("Could not verify signature: " + e.getMessage());
        }
    }

    private String normalizeAddress(String address) {
        if (address == null || !address.matches("^0x[0-9a-fA-F]{40}$")) {
            throw new RuntimeException("Invalid wallet address");
        }
        return Keys.toChecksumAddress(address);
    }

    /** fyp.scm.user.Role (FARMER, COOPERATIVE, TRANSPORTER, CONSUMER) -> contract Role uint8. */
    private int roleToContractValue(fyp.scm.user.Role role) {
        // Contract enum: NONE=0, FARMER=1, COOPERATIVE=2, TRANSPORTER=3, CONSUMER=4
        // Our enum happens to declare the same 4 roles in the same order, so
        // ordinal + 1 lines up. Written out explicitly so it stays correct
        // even if either enum's order ever changes.
        return switch (role) {
            case FARMER -> 1;
            case COOPERATIVE -> 2;
            case TRANSPORTER -> 3;
            case CONSUMER -> 4;
            // SUPERADMIN is off-chain only; it never links a wallet.
            case SUPERADMIN -> throw new RuntimeException("Superadmin has no on-chain role");
        };
    }
}
