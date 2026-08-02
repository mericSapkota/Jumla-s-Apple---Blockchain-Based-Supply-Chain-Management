package fyp.scm.chat;

import fyp.scm.chat.dto.ChatMessageResponse;
import fyp.scm.chat.dto.ConversationSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int HISTORY_LIMIT = 20; // turns of context sent to the model
    private static final String FALLBACK_REPLY =
            "Thanks for your message! Our AI assistant is temporarily unavailable, "
            + "but the Jumla Trace team has received your note and will follow up. "
            + "In the meantime you can scan any batch QR code to trace an apple's journey.";

    private final ChatRepository chatRepository;
    private final ChatSettingRepository settingRepository;
    private final AnthropicClient anthropicClient;

    // ── Visitor-facing ────────────────────────────────────────────────

    public boolean isEnabled() {
        return getOrCreateSetting().isAiEnabled();
    }

    @Transactional
    public ChatMessageResponse sendMessage(String sessionId, String message, String userEmail) {
        if (!isEnabled()) {
            throw new ChatDisabledException("The AI assistant is currently turned off.");
        }

        // 1) store the visitor's message
        ChatMessage userMsg = new ChatMessage();
        userMsg.setSessionId(sessionId);
        userMsg.setRole("user");
        userMsg.setContent(message);
        userMsg.setUserEmail(userEmail);
        chatRepository.save(userMsg);

        // 2) build the recent history for context
        List<ChatMessage> thread = chatRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<Map<String, String>> history = new ArrayList<>();
        int start = Math.max(0, thread.size() - HISTORY_LIMIT);
        for (ChatMessage m : thread.subList(start, thread.size())) {
            history.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }

        // 3) ask the model (falls back gracefully if unconfigured / errored)
        String replyText = anthropicClient.complete(history);
        if (replyText == null || replyText.isBlank()) {
            replyText = FALLBACK_REPLY;
        }

        // 4) store and return the assistant reply
        ChatMessage assistantMsg = new ChatMessage();
        assistantMsg.setSessionId(sessionId);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(replyText);
        assistantMsg.setUserEmail(userEmail);
        chatRepository.save(assistantMsg);

        return ChatMessageResponse.from(assistantMsg);
    }

    public List<ChatMessageResponse> getSessionHistory(String sessionId) {
        return chatRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream().map(ChatMessageResponse::from).toList();
    }

    // ── Admin-facing ──────────────────────────────────────────────────

    public List<ConversationSummary> listConversations() {
        // Newest message first; fold into one summary per session.
        List<ChatMessage> all = chatRepository.findAllByOrderByCreatedAtDesc();
        Map<String, ConversationSummary> bySession = new LinkedHashMap<>();
        Map<String, Integer> counts = new LinkedHashMap<>();

        for (ChatMessage m : all) {
            counts.merge(m.getSessionId(), 1, Integer::sum);
            // First time we see a session (i.e. its newest message) sets the preview.
            bySession.computeIfAbsent(m.getSessionId(), sid -> new ConversationSummary(
                    sid,
                    m.getUserEmail(),
                    0,
                    preview(m.getContent()),
                    m.getCreatedAt()
            ));
            // Keep a non-null email if any message in the session had one.
            ConversationSummary s = bySession.get(m.getSessionId());
            if (s.getUserEmail() == null && m.getUserEmail() != null) {
                s.setUserEmail(m.getUserEmail());
            }
        }
        bySession.forEach((sid, s) -> s.setMessageCount(counts.getOrDefault(sid, 0)));

        List<ConversationSummary> result = new ArrayList<>(bySession.values());
        result.sort(Comparator.comparing(ConversationSummary::getUpdatedAt).reversed());
        return result;
    }

    public boolean setEnabled(boolean enabled) {
        ChatSetting setting = getOrCreateSetting();
        setting.setAiEnabled(enabled);
        settingRepository.save(setting);
        return setting.isAiEnabled();
    }

    public boolean isAiConfigured() {
        return anthropicClient.isConfigured();
    }

    // ── helpers ───────────────────────────────────────────────────────

    private ChatSetting getOrCreateSetting() {
        return settingRepository.findById(1L).orElseGet(() -> {
            ChatSetting s = new ChatSetting();
            s.setId(1L);
            s.setAiEnabled(true);
            return settingRepository.save(s);
        });
    }

    private String preview(String content) {
        if (content == null) return "";
        String trimmed = content.strip();
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 117) + "…";
    }
}
