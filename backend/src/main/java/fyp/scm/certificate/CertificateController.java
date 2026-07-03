package fyp.scm.certificate;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificate")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    // GET /api/certificate/status — how many tx so far, eligible or not, already issued or not
    @GetMapping("/status")
    public ResponseEntity<CertificateStatusResponse> status(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(certificateService.getStatus(userDetails.getUsername()));
    }

    // GET /api/certificate/generate — returns the PDF (requires >= 5 tx)
    @GetMapping("/generate")
    public ResponseEntity<byte[]> generate(@AuthenticationPrincipal UserDetails userDetails) {
        byte[] pdf = certificateService.generateCertificatePdf(userDetails.getUsername());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("jumla-trace-certificate.pdf").build());

        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
