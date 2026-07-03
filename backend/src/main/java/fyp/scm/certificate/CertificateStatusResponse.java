package fyp.scm.certificate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CertificateStatusResponse {
    private boolean eligible;
    private long transactionCount;
    private long requiredTransactions; // always 5, exposed for the frontend progress bar
    private boolean alreadyIssued;
    private String certificateNumber;     // null if not yet issued
    private LocalDateTime issuedAt;       // null if not yet issued
}
