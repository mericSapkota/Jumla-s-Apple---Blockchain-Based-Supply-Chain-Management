package fyp.scm.donation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class DonationResponse {
    private Long amount;
    private String recipientName;
    private String recipientPhone;
    private String message;
}
