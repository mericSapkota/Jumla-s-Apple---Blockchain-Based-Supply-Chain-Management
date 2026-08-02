package fyp.scm.chat;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A single turn in a support conversation. Both the visitor's messages and the
 * AI assistant's replies are stored here so the whole thread can be replayed on
 * the admin site.
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_session", columnList = "sessionId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Groups messages into one conversation. Generated on the client and reused
    // for the lifetime of a chat widget session.
    @Column(nullable = false, length = 80)
    private String sessionId;

    // "user" or "assistant"
    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Email of the logged-in sender, or null for anonymous visitors.
    private String userEmail;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
