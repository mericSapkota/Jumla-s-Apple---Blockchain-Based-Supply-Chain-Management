package fyp.scm.chat.dto;

import fyp.scm.chat.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private String sessionId;
    private String role;
    private String content;
    private String userEmail;
    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(
                m.getId(), m.getSessionId(), m.getRole(),
                m.getContent(), m.getUserEmail(), m.getCreatedAt());
    }
}
