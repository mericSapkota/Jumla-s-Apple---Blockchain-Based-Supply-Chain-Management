package fyp.scm.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper over the Anthropic Messages API. Given the running conversation
 * it returns the assistant's next reply as plain text.
 *
 * The API key comes from the ANTHROPIC_API_KEY env var. If it is not set the
 * client stays disabled and callers fall back to a friendly canned message, so
 * the feature degrades gracefully instead of throwing.
 */
@Slf4j
@Component
public class AnthropicClient {

    private static final String SYSTEM_PROMPT = """
            You are the friendly support assistant for Jumla Trace, a blockchain based
            supply chain traceability platform for Jumla apples in Nepal. You help
            visitors, farmers, cooperatives, transporters and consumers understand how
            the platform works: registering apple batches, certification by
            cooperatives, transport tracking, QR code verification for consumers,
            digital certificates, and donations. Answer clearly and concisely. If a
            question is outside the scope of Jumla Trace or apple supply chains,
            politely steer the conversation back. Never invent order or account
            details you have not been given.
            """;

    private final RestClient restClient = RestClient.create();

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-5}")
    private String model;

    @Value("${anthropic.max-tokens:1024}")
    private int maxTokens;

    @Value("${anthropic.base-url:https://api.anthropic.com/v1/messages}")
    private String baseUrl;

    @Value("${anthropic.version:2023-06-01}")
    private String anthropicVersion;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param history conversation so far, oldest first, each entry
     *                {"role": "user"|"assistant", "content": "..."}
     * @return the assistant's reply text, or null if the call could not be made
     */
    @SuppressWarnings("unchecked")
    public String complete(List<Map<String, String>> history) {
        if (!isConfigured()) {
            log.warn("ANTHROPIC_API_KEY not set — returning fallback chat reply");
            return null;
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        for (Map<String, String> turn : history) {
            messages.add(Map.of("role", turn.get("role"), "content", turn.get("content")));
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "system", SYSTEM_PROMPT,
                "messages", messages
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri(baseUrl)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", anthropicVersion)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return null;
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
            if (content == null || content.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> block : content) {
                if ("text".equals(block.get("type")) && block.get("text") != null) {
                    sb.append(block.get("text"));
                }
            }
            String text = sb.toString().trim();
            return text.isEmpty() ? null : text;
        } catch (Exception e) {
            log.error("Anthropic API call failed: {}", e.getMessage());
            return null;
        }
    }
}
