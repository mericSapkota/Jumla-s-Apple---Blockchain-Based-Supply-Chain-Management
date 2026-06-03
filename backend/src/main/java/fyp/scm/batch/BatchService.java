package fyp.scm.batch;



import fyp.scm.contract.AppleBatch;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchService {

    private final Web3j web3j;
    private final Credentials credentials;
    private final ContractGasProvider gasProvider;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;

    @Value("${web3j.contract-address}")
    private String contractAddress;

    // ─── Load the Web3j contract wrapper ─────────────────────────────────────
    // NOTE: AppleBatch is the Web3j-generated wrapper class.
    // Generate it with: web3j generate solidity -a artifacts/AppleBatch.json -o src/main/java -p com.jumla.supplychain.contract
    // For now this method loads the contract at the configured address.
    private AppleBatch loadContract() {
        return AppleBatch.load(contractAddress, web3j, credentials, gasProvider);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FARMER — Create Batch
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse createBatch(CreateBatchRequest req, String farmerEmail) {
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        // Generate unique batch ID
        String batchId = generateBatchId();

        // Parse harvest date
        LocalDateTime harvestDate = LocalDateTime.parse(
                req.getHarvestDate(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        BigInteger harvestTimestamp = BigInteger.valueOf(
                harvestDate.toEpochSecond(ZoneOffset.UTC));

        String aiResult = req.getAiResult() != null ? req.getAiResult() : "PENDING";
        String ipfsHash = req.getIpfsHash() != null ? req.getIpfsHash() : "";

        try {
            // ── Call smart contract ──────────────────────────────────────────
            AppleBatch contract = loadContract();
            TransactionReceipt receipt = contract.createBatch(
                    batchId,
                    farmer.getFullName(),
                    req.getFarmLocation(),
                    req.getAppleVariety(),
                    BigInteger.valueOf(req.getWeightKg()),
                    harvestTimestamp,
                    ipfsHash,
                    aiResult
            ).send();

            log.info("Batch {} created on blockchain. TxHash: {}", batchId, receipt.getTransactionHash());

            // ── Save to PostgreSQL ───────────────────────────────────────────
            BatchEntity entity = BatchEntity.builder()
                    .batchId(batchId)
                    .farmerEmail(farmerEmail)
                    .farmerName(farmer.getFullName())
                    .farmLocation(req.getFarmLocation())
                    .appleVariety(req.getAppleVariety())
                    .weightKg(req.getWeightKg())
                    .harvestDate(harvestDate)
                    .status(BatchStatus.HARVESTED)
                    .aiResult(aiResult)
                    .ipfsHash(ipfsHash)
                    .photoPath(req.getPhotoPath())
                    .txHashCreate(receipt.getTransactionHash())
                    .build();

            batchRepository.save(entity);

            return mapToResponse(entity, null);

        } catch (Exception e) {
            log.error("Failed to create batch on blockchain: {}", e.getMessage());
            throw new RuntimeException("Blockchain transaction failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  COOPERATIVE — Certify Batch
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse certifyBatch(String batchId) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        if (entity.getStatus() != BatchStatus.HARVESTED) {
            throw new RuntimeException("Batch must be in HARVESTED status to certify");
        }

        try {
            AppleBatch contract = loadContract();
            TransactionReceipt receipt = contract.certifyBatch(batchId).send();

            log.info("Batch {} certified on blockchain. TxHash: {}", batchId, receipt.getTransactionHash());

            entity.setStatus(BatchStatus.CERTIFIED);
            entity.setTxHashCertify(receipt.getTransactionHash());
            batchRepository.save(entity);

            return mapToResponse(entity, null);

        } catch (Exception e) {
            log.error("Failed to certify batch {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Blockchain transaction failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  TRANSPORTER — Update Transit
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse updateTransit(String batchId, TransitUpdateRequest req) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        if (entity.getStatus() != BatchStatus.CERTIFIED &&
                entity.getStatus() != BatchStatus.IN_TRANSIT) {
            throw new RuntimeException("Batch must be CERTIFIED or IN_TRANSIT to update transit");
        }

        String destination = req.getDestination() != null
                ? req.getDestination()
                : (entity.getDestination() != null ? entity.getDestination() : "");

        try {
            AppleBatch contract = loadContract();
            TransactionReceipt receipt = contract.updateTransit(
                    batchId, req.getLocation(), destination).send();

            log.info("Transit updated for batch {}. Location: {}. TxHash: {}",
                    batchId, req.getLocation(), receipt.getTransactionHash());

            // First transit call — promote status
            if (entity.getStatus() == BatchStatus.CERTIFIED) {
                entity.setStatus(BatchStatus.IN_TRANSIT);
                entity.setDestination(destination);
                entity.setTxHashTransit(receipt.getTransactionHash());
            }

            batchRepository.save(entity);
            return mapToResponse(entity, null);

        } catch (Exception e) {
            log.error("Failed to update transit for batch {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Blockchain transaction failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  TRANSPORTER — Deliver Batch
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse deliverBatch(String batchId) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        if (entity.getStatus() != BatchStatus.IN_TRANSIT) {
            throw new RuntimeException("Batch must be IN_TRANSIT to mark as delivered");
        }

        try {
            AppleBatch contract = loadContract();
            TransactionReceipt receipt = contract.deliverBatch(batchId).send();

            log.info("Batch {} delivered. TxHash: {}", batchId, receipt.getTransactionHash());

            entity.setStatus(BatchStatus.DELIVERED);
            entity.setTxHashDeliver(receipt.getTransactionHash());
            batchRepository.save(entity);

            return mapToResponse(entity, null);

        } catch (Exception e) {
            log.error("Failed to deliver batch {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Blockchain transaction failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FARMER — Update IPFS Hash (after photo upload)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public BatchResponse updateIpfsHash(String batchId, IpfsUpdateRequest req, String farmerEmail) {
        BatchEntity entity = getBatchEntityOrThrow(batchId);

        if (!entity.getFarmerEmail().equals(farmerEmail)) {
            throw new RuntimeException("Only the batch owner can update the IPFS hash");
        }

        try {
            AppleBatch contract = loadContract();
            contract.updateIPFSHash(batchId, req.getIpfsHash()).send();

            entity.setIpfsHash(req.getIpfsHash());
            if (req.getAiResult() != null) {
                entity.setAiResult(req.getAiResult());
            }
            batchRepository.save(entity);

            return mapToResponse(entity, null);

        } catch (Exception e) {
            log.error("Failed to update IPFS hash for batch {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Blockchain transaction failed: " + e.getMessage());
        }
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

    private String generateBatchId() {
        // Format: JML-2025-XXXX (year + 4 random hex chars)
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
}