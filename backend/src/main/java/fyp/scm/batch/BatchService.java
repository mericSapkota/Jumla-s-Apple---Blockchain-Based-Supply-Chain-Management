package fyp.scm.batch;



import fyp.scm.certificate.BlockchainTransactionLog;
import fyp.scm.certificate.BlockchainTransactionLogRepository;
import fyp.scm.contract.AppleBatch;
import fyp.scm.storage.FileStorageService;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tuples.generated.Tuple12;
import org.web3j.tuples.generated.Tuple3;
import org.web3j.tx.gas.ContractGasProvider;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

// ─────────────────────────────────────────────────────────────────────────────
//  IMPORTANT: this service no longer signs or sends any batch-mutating
//  transaction itself. Every farmer/cooperative/transporter action is signed
//  and sent by the USER'S OWN MetaMask wallet in the browser (see the
//  frontend's src/blockchain/batchContract.js). Roles are enforced by the
//  smart contract's onlyRole(msg.sender) checks against that wallet.
//
//  What this service does instead, for every mutating action:
//    1. Look up the transaction receipt for the txHash the frontend sends
//       and make sure it succeeded and actually hit our contract.
//    2. Re-read the authoritative state straight off the contract (never
//       trust batch fields from the request body) and mirror it into
//       Postgres for fast queries / dashboards.
//
//  `web3j`/`credentials` here are the backend's OWN key, used only for
//  read-only `view` calls (which don't check msg.sender), never for
//  sending transactions on a user's behalf.
// ─────────────────────────────────────────────────────────────────────────────
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchService {

    private final Web3j web3j;
    private final Credentials credentials;
    private final ContractGasProvider gasProvider;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final BlockchainTransactionLogRepository transactionLogRepository;
    private final FileStorageService fileStorageService;

    @Value("${web3j.contract-address}")
    private String contractAddress;


    private AppleBatch loadContract() {
        return AppleBatch.load(contractAddress, web3j, credentials, gasProvider);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FARMER — Create Batch (tx already sent by the farmer's own wallet)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse createBatch(CreateBatchRequest req, String farmerEmail) {
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        if (batchRepository.existsByBatchId(req.getBatchId())) {
            throw new RuntimeException("Batch " + req.getBatchId() + " has already been recorded");
        }

        verifyOnChainSuccess(req.getTxHash());

        Tuple12<String, String, String, String, BigInteger, BigInteger, BigInteger, BigInteger,
                String, BigInteger, String, String> chainData = fetchBatchFromChain(req.getBatchId());

        BatchEntity entity = BatchEntity.builder()
                .batchId(req.getBatchId())
                .farmerEmail(farmerEmail)
                .farmerName(chainData.component2())
                .farmLocation(chainData.component3())
                .appleVariety(chainData.component4())
                .weightKg(chainData.component5().longValue())
                .harvestDate(toLocalDateTime(chainData.component6()))
                .status(statusFromChain(chainData.component7()))
                .destination(chainData.component9())
                .ipfsHash(chainData.component11())
                .aiResult(chainData.component12())
                .photoPath(req.getPhotoPath())
                .txHashCreate(req.getTxHash())
                .build();

        batchRepository.save(entity);

        log.info("Batch {} confirmed on-chain and mirrored to Postgres. TxHash: {}",
                req.getBatchId(), req.getTxHash());

        logTransaction(farmerEmail, farmer.getRole().name(), req.getBatchId(),
                BlockchainTransactionLog.TransactionType.CREATE_BATCH, req.getTxHash());

        return mapToResponse(entity, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FARMER — Upload the AI-verified apple photo (off-chain).
    //  Called before createBatch(); the returned path is passed back in the
    //  create request and persisted on the batch so the cooperative and
    //  consumers can see the same picture that was verified.
    // ─────────────────────────────────────────────────────────────────────────
    public String storeBatchPhoto(org.springframework.web.multipart.MultipartFile photo) {
        return fileStorageService.storeBatchImage(photo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  COOPERATIVE — Certify Batch (tx already sent by the cooperative's wallet)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse certifyBatch(String batchId, TxHashRequest req, String cooperativeEmail) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        verifyOnChainSuccess(req.getTxHash());
        syncEntityFromChain(entity, batchId);

        if (entity.getStatus() != BatchStatus.CERTIFIED) {
            throw new RuntimeException("On-chain status is not CERTIFIED yet — transaction may still be pending");
        }
        entity.setTxHashCertify(req.getTxHash());
        batchRepository.save(entity);

        logTransaction(cooperativeEmail, "COOPERATIVE", batchId,
                BlockchainTransactionLog.TransactionType.CERTIFY_BATCH, req.getTxHash());

        return mapToResponse(entity, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  TRANSPORTER — Update Transit (tx already sent by the transporter's wallet)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse updateTransit(String batchId, TransitUpdateRequest req, String transporterEmail) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        verifyOnChainSuccess(req.getTxHash());
        syncEntityFromChain(entity, batchId);

        if (entity.getTxHashTransit() == null) {
            entity.setTxHashTransit(req.getTxHash());
        }
        batchRepository.save(entity);

        logTransaction(transporterEmail, "TRANSPORTER", batchId,
                BlockchainTransactionLog.TransactionType.UPDATE_TRANSIT, req.getTxHash());

        List<BatchResponse.TransitCheckpoint> history = getTransitHistoryFromChain(batchId);
        return mapToResponse(entity, history);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  TRANSPORTER — Deliver Batch (tx already sent by the transporter's wallet)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse deliverBatch(String batchId, TxHashRequest req, String transporterEmail) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        verifyOnChainSuccess(req.getTxHash());
        syncEntityFromChain(entity, batchId);

        if (entity.getStatus() != BatchStatus.DELIVERED) {
            throw new RuntimeException("On-chain status is not DELIVERED yet — transaction may still be pending");
        }
        entity.setTxHashDeliver(req.getTxHash());
        batchRepository.save(entity);

        logTransaction(transporterEmail, "TRANSPORTER", batchId,
                BlockchainTransactionLog.TransactionType.DELIVER_BATCH, req.getTxHash());

        return mapToResponse(entity, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FARMER — Update IPFS Hash (tx already sent by the farmer's own wallet)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse updateIpfsHash(String batchId, IpfsUpdateRequest req, String farmerEmail) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        if (!entity.getFarmerEmail().equals(farmerEmail)) {
            throw new RuntimeException("Only the batch owner can update the IPFS hash");
        }

        verifyOnChainSuccess(req.getTxHash());
        syncEntityFromChain(entity, batchId);
        batchRepository.save(entity);

        return mapToResponse(entity, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ — Get Single Batch (with blockchain transit history)
    // ─────────────────────────────────────────────────────────────────────────
    public BatchResponse getBatch(String batchId) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        // Fetch transit history from blockchain (source of truth)
        List<BatchResponse.TransitCheckpoint> history = getTransitHistoryFromChain(batchId);

        return mapToResponse(entity, history);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ — Get All Batches by Farmer
    // ─────────────────────────────────────────────────────────────────────────
    public List<BatchResponse> getBatchesByFarmer(String farmerEmail) {
        return batchRepository.findByFarmerEmail(farmerEmail)
                .stream()
                .map(e -> mapToResponse(e, null))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  READ — Get All Batches by Status (for Cooperative / Transporter dashboards)
    // ─────────────────────────────────────────────────────────────────────────
    public List<BatchResponse> getBatchesByStatus(BatchStatus status) {
        return batchRepository.findByStatus(status)
                .stream()
                .map(e -> mapToResponse(e, null))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private BatchEntity getBatchEntityOrThrow(String batchId) {
        return batchRepository.findByBatchId(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
    }

    /** Confirms a client-submitted tx hash actually succeeded against our contract. */
    private void verifyOnChainSuccess(String txHash) {
        try {
            TransactionReceipt receipt = web3j.ethGetTransactionReceipt(txHash).send()
                    .getTransactionReceipt()
                    .orElseThrow(() -> new RuntimeException(
                            "Transaction not found or not yet mined: " + txHash));

            if (!receipt.isStatusOK()) {
                throw new RuntimeException("On-chain transaction failed (reverted): " + txHash);
            }
            if (receipt.getTo() == null || !receipt.getTo().equalsIgnoreCase(contractAddress)) {
                throw new RuntimeException("Transaction was not sent to the batch contract");
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new RuntimeException("Could not verify blockchain transaction: " + e.getMessage());
        }
    }

    private Tuple12<String, String, String, String, BigInteger, BigInteger, BigInteger, BigInteger,
            String, BigInteger, String, String> fetchBatchFromChain(String batchId) {
        try {
            return loadContract().getBatch(batchId).send();
        } catch (Exception e) {
            throw new RuntimeException("Could not read batch " + batchId + " from chain: " + e.getMessage());
        }
    }

    /** Re-reads batch state from the chain and updates the mutable fields on `entity`. */
    private void syncEntityFromChain(BatchEntity entity, String batchId) {
        var chainData = fetchBatchFromChain(batchId);
        entity.setStatus(statusFromChain(chainData.component7()));
        entity.setDestination(chainData.component9());
        entity.setIpfsHash(chainData.component11());
        entity.setAiResult(chainData.component12());
    }

    private BatchStatus statusFromChain(BigInteger statusOrdinal) {
        BatchStatus[] values = BatchStatus.values();
        int idx = statusOrdinal.intValue();
        if (idx < 0 || idx >= values.length) {
            throw new RuntimeException("Unknown on-chain batch status: " + idx);
        }
        return values[idx];
    }

    private LocalDateTime toLocalDateTime(BigInteger epochSeconds) {
        return LocalDateTime.ofEpochSecond(epochSeconds.longValue(), 0, ZoneOffset.UTC);
    }

    private List<BatchResponse.TransitCheckpoint> getTransitHistoryFromChain(String batchId) {
        try {
            AppleBatch contract = loadContract();

            // getTransitHistory returns Tuple3<List<String>, List<BigInteger>, List<String>>
            Tuple3<List<String>, List<BigInteger>, List<String>> result =
                    contract.getTransitHistory(batchId).send();

            List<String> locations   = result.component1();
            List<BigInteger> timestamps = result.component2();
            List<String> updaters    = result.component3();

            return java.util.stream.IntStream.range(0, locations.size())
                    .mapToObj(i -> new BatchResponse.TransitCheckpoint(
                            locations.get(i),
                            timestamps.get(i).longValue(),
                            updaters.get(i)
                    ))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Could not fetch transit history from blockchain for batch {}: {}", batchId, e.getMessage());
            return List.of(); // return empty list — don't crash if chain is unreachable
        }
    }

    private BatchResponse mapToResponse(BatchEntity e,
                                        List<BatchResponse.TransitCheckpoint> history) {
        return BatchResponse.builder()
                .batchId(e.getBatchId())
                .farmerName(e.getFarmerName())
                .farmerEmail(e.getFarmerEmail())
                .farmLocation(e.getFarmLocation())
                .appleVariety(e.getAppleVariety())
                .weightKg(e.getWeightKg())
                .harvestDate(e.getHarvestDate())
                .status(e.getStatus().name())
                .destination(e.getDestination())
                .ipfsHash(e.getIpfsHash())
                .aiResult(e.getAiResult())
                .photoPath(e.getPhotoPath())
                .txHashCreate(e.getTxHashCreate())
                .txHashCertify(e.getTxHashCertify())
                .txHashTransit(e.getTxHashTransit())
                .txHashDeliver(e.getTxHashDeliver())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .transitHistory(history)
                .build();
    }

    /** Format: JML-2025-XXXX (year + 4 random hex chars). Public so the frontend can request one. */
    public String generateBatchId() {
        int year = LocalDateTime.now().getYear();
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String candidate = "JML-" + year + "-" + suffix;
        // Ensure uniqueness
        while (batchRepository.existsByBatchId(candidate)) {
            suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            candidate = "JML-" + year + "-" + suffix;
        }
        return candidate;
    }

    /** Persists a confirmed blockchain transaction for certificate eligibility tracking. */
    private void logTransaction(String userEmail, String role, String batchId,
                                BlockchainTransactionLog.TransactionType type, String txHash) {
        try {
            transactionLogRepository.save(BlockchainTransactionLog.builder()
                    .userEmail(userEmail)
                    .role(role)
                    .batchId(batchId)
                    .type(type)
                    .txHash(txHash)
                    .build());
        } catch (Exception ex) {
            // Log but do NOT roll back the batch operation — the batch is already on chain.
            log.warn("Could not save transaction log for {} / {}: {}", userEmail, batchId, ex.getMessage());
        }
    }
}
