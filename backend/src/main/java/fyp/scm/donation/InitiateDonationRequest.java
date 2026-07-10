package fyp.scm.donation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InitiateDonationRequest {

    @NotNull(message = "Amount is required")
    @Min(value = 10, message = "Minimum donation is Rs. 10")
    @Max(value = 100000, message = "Maximum donation is Rs. 100,000")
    private Long amount;

    @Size(max = 100)
    private String donorName;

    @Size(max = 500)
    private String message;
}
