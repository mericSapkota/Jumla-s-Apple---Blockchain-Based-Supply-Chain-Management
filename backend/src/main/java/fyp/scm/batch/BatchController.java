package fyp.scm.batch;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    // ── GET /api/batch/next-id ──────────────────────────────────────────────
    // Role: FARMER
    // Hands out a unique candidate batch ID for the frontend to use in its
    // MetaMask-signed createBatch() call, before anything is persisted here.
    @GetMapping("/next-id")
    public ResponseEntity<Map<String, String>> nextBatchId() {
        return ResponseEntity.ok(Map.of("batchId", batchService.generateBatchId()));
    }

    // ── POST /api/batch/photo ──────────────────────────────────────────────
    // Role: FARMER
    // Stores the AI-verified apple photo and returns its relative path. The
    // farmer includes that path in the subsequent createBatch() call so it is
    // persisted on the batch (visible to the cooperative and to consumers).
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadBatchPhoto(
            @RequestPart("photo") MultipartFile photo) {
        return ResponseEntity.ok(Map.of("path", batchService.storeBatchPhoto(photo)));
    }

    // ── POST /api/batch/create ─────────────────────────────────────────────
    // Role: FARMER
    // The farmer's own wallet already sent createBatch() on-chain. This just
    // verifies the tx and mirrors the on-chain record into Postgres.
    @PostMapping("/create")
    public ResponseEntity<BatchResponse> createBatch(
            @RequestBody @Valid CreateBatchRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        BatchResponse response = batchService.createBatch(req, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ── PUT /api/batch/certify/{id} ────────────────────────────────────────
    // Role: COOPERATIVE
    // Verifies the cooperative's own certifyBatch() tx and syncs status.
    @PutMapping("/certify/{batchId}")
    public ResponseEntity<BatchResponse> certifyBatch(
            @PathVariable String batchId,
            @RequestBody @Valid TxHashRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(batchService.certifyBatch(batchId, req, userDetails.getUsername()));
    }

    // ── PUT /api/batch/transit/{id} ────────────────────────────────────────
    // Role: TRANSPORTER
    // Verifies the transporter's own updateTransit() tx and syncs status.
    @PutMapping("/transit/{batchId}")
    public ResponseEntity<BatchResponse> updateTransit(
            @PathVariable String batchId,
            @RequestBody @Valid TransitUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(batchService.updateTransit(batchId, req, userDetails.getUsername()));
    }

    // ── PUT /api/batch/deliver/{id} ────────────────────────────────────────
    // Role: TRANSPORTER
    // Verifies the transporter's own deliverBatch() tx and syncs status.
    @PutMapping("/deliver/{batchId}")
    public ResponseEntity<BatchResponse> deliverBatch(
            @PathVariable String batchId,
            @RequestBody @Valid TxHashRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(batchService.deliverBatch(batchId, req, userDetails.getUsername()));
    }

    // ── PUT /api/batch/ipfs/{id} ───────────────────────────────────────────
    // Role: FARMER
    // Updates IPFS hash + AI result after photo is uploaded
    @PutMapping("/ipfs/{batchId}")
    public ResponseEntity<BatchResponse> updateIpfsHash(
            @PathVariable String batchId,
            @RequestBody @Valid IpfsUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                batchService.updateIpfsHash(batchId, req, userDetails.getUsername()));
    }

    // ── GET /api/batch/{id} ────────────────────────────────────────────────
    // Public — Consumer trace view (includes transit history from blockchain)
    @GetMapping("/{batchId}")
    public ResponseEntity<BatchResponse> getBatch(@PathVariable String batchId) {
        return ResponseEntity.ok(batchService.getBatch(batchId));
    }

    // ── GET /api/batch/my/batches ──────────────────────────────────────────
    // Role: FARMER — returns all batches created by the logged-in farmer
    @GetMapping("/my/batches")
    public ResponseEntity<List<BatchResponse>> getMyBatches(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                batchService.getBatchesByFarmer(userDetails.getUsername()));
    }

    // ── GET /api/batch/status/{status} ────────────────────────────────────
    // Role: COOPERATIVE (HARVESTED), TRANSPORTER (CERTIFIED / IN_TRANSIT)
    // Returns batches filtered by status — used for dashboards
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BatchResponse>> getBatchesByStatus(
            @PathVariable String status) {

        BatchStatus batchStatus = BatchStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(batchService.getBatchesByStatus(batchStatus));
    }
}