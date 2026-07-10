package fyp.scm.donation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    // Public: visitors donate without an account. Returns the eSewa form URL
    // and signed fields; the frontend builds a hidden form and submits it.
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiate(@RequestBody @Valid InitiateDonationRequest req) {
        return ResponseEntity.ok(donationService.initiate(req));
    }

    // eSewa redirects the donor's browser here with ?data=<base64 JSON>.
    @GetMapping("/success")
    public ResponseEntity<Void> success(@RequestParam String data) {
        return redirect(donationService.handleSuccess(data));
    }

    @GetMapping("/failure/{transactionUuid}")
    public ResponseEntity<Void> failure(@PathVariable String transactionUuid) {
        return redirect(donationService.handleFailure(transactionUuid));
    }

    private ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }
}
