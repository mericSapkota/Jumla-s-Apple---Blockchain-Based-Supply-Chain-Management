package fyp.scm.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {

    // Client-generated conversation id (reused across a widget session).
    @NotBlank(message = "sessionId is required")
    @Size(max = 80)
    private String sessionId;

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 2000, message = "Message is too long")
    private String message;
}
