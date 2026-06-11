package fyp.scm.batch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IpfsUpdateRequest {

    @NotBlank(message = "IPFS hash is required")
    private String ipfsHash;

    private String aiResult;
}