package fyp.scm.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/** One row in the admin "Chat" tab conversation list. */
@Data
@AllArgsConstructor
public class ConversationSummary {
    private String sessionId;
    private String userEmail;   // null for anonymous visitors
    private int messageCount;
    private String lastMessage; // preview of the most recent turn
    private LocalDateTime updatedAt;
}
