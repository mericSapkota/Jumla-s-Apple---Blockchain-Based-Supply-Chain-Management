package fyp.scm.chat;

import fyp.scm.chat.dto.ChatMessageResponse;
import fyp.scm.chat.dto.ChatRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Public-facing chat endpoints used by the floating chat widget. Anonymous
 * visitors and logged-in users can both use it; when authenticated we tag the
 * conversation with their email.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // Lets the widget decide whether to show itself at all.
    @GetMapping("/enabled")
    public Map<String, Boolean> enabled() {
        return Map.of("enabled", chatService.isEnabled());
    }

    @PostMapping
    public ChatMessageResponse send(@Valid @RequestBody ChatRequest request, Authentication auth) {
        String email = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            email = auth.getName();
        }
        return chatService.sendMessage(request.getSessionId(), request.getMessage(), email);
    }

    // Lets a returning widget session reload its own transcript.
    @GetMapping("/{sessionId}")
    public List<ChatMessageResponse> history(@PathVariable String sessionId) {
        return chatService.getSessionHistory(sessionId);
    }

    @ExceptionHandler(ChatDisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(ChatDisabledException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", ex.getMessage()));
    }
}
