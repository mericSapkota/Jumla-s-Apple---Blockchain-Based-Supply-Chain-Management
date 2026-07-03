package fyp.scm.batch;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    // ── POST /api/batch/create ─────────────────────────────────────────────
    // Role: FARMER
    // Creates a new apple batch in DB + on blockchain
    @PostMapping("/create")
    public ResponseEntity<BatchResponse> createBatch(
            @RequestBody @Valid CreateBatchRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        BatchResponse response = batchService.createBatch(req, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ── PUT /api/batch/certify/{id} ────────────────────────────────────────
    // Role: COOPERATIVE
    // Certifies a HARVESTED batch
    @PutMapping("/certify/{batchId}")
    public ResponseEntity<BatchResponse> certifyBatch(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(batchService.certifyBatch(batchId, userDetails.getUsername()));
    }

    // ── PUT /api/batch/transit/{id} ────────────────────────────────────────
    // Role: TRANSPORTER
    // Logs a transit checkpoint (first call also moves status to IN_TRANSIT)
    @PutMapping("/transit/{batchId}")
    public ResponseEntity<BatchResponse> updateTransit(
            @PathVariable String batchId,
            @RequestBody @Valid TransitUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(batchService.updateTransit(batchId, req, userDetails.getUsername()));
    }

    // ── PUT /api/batch/deliver/{id} ────────────────────────────────────────
    // Role: TRANSPORTER
    // Marks batch as DELIVERED
    @PutMapping("/deliver/{batchId}")
    public ResponseEntity<BatchResponse> deliverBatch(
            @PathVariable String batchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(batchService.deliverBatch(batchId, userDetails.getUsername()));
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