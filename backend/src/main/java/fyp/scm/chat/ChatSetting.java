package fyp.scm.chat;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Single-row table (id = 1) holding admin-controlled chat settings. Right now
 * that's just the on/off toggle for the AI assistant.
 */
@Entity
@Table(name = "chat_settings")
@Data
public class ChatSetting {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private boolean aiEnabled = true;
}
