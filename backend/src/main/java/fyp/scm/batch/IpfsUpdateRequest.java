package fyp.scm.batch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IpfsUpdateRequest {

    @NotBlank(message = "Transaction hash is required")
    private String txHash;
}
