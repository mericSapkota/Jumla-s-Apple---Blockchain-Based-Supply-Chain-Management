package fyp.scm.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    // Newest first — the admin conversation list and the per-session history
    // grouping in ChatService both build off this.
    List<ChatMessage> findAllByOrderByCreatedAtDesc();
}
