package fyp.scm.chat;

import fyp.scm.chat.dto.ChatMessageResponse;
import fyp.scm.chat.dto.ConversationSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin (SUPERADMIN) view of the chat feature: browse every conversation the AI
 * assistant has had, and turn the assistant on or off. Secured by the
 * "/api/admin/**" rule in SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public List<ConversationSummary> conversations() {
        return chatService.listConversations();
    }

    @GetMapping("/conversations/{sessionId}")
    public List<ChatMessageResponse> conversation(@PathVariable String sessionId) {
        return chatService.getSessionHistory(sessionId);
    }

    // Human admin reply — used when the AI is toggled off and a person answers.
    @PostMapping("/conversations/{sessionId}/reply")
    public ChatMessageResponse reply(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails admin) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Reply message cannot be empty");
        }
        return chatService.adminReply(sessionId, message, admin.getUsername());
    }

    // Current toggle state + whether an API key is actually configured.
    @GetMapping("/settings")
    public Map<String, Boolean> settings() {
        return Map.of(
                "enabled", chatService.isEnabled(),
                "aiConfigured", chatService.isAiConfigured()
        );
    }

    @PutMapping("/settings")
    public Map<String, Boolean> updateSettings(@RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return Map.of(
                "enabled", chatService.setEnabled(enabled),
                "aiConfigured", chatService.isAiConfigured()
        );
    }
}
