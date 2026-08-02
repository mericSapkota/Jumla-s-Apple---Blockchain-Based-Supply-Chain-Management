package fyp.scm.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper over the Google Gemini (Generative Language) API. Given the
 * running conversation it returns the assistant's next reply as plain text.
 *
 * The API key comes from the GEMINI_API_KEY env var. If it is not set the client
 * stays disabled and callers fall back to a friendly canned message, so the
 * feature degrades gracefully instead of throwing.
 */
@Slf4j
@Component
public class GeminiClient {

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

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

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
            log.warn("GEMINI_API_KEY not set — returning fallback chat reply");
            return null;
        }

        // Gemini uses "user" and "model" for the two roles. Anything that isn't a
        // visitor message (assistant / admin) is a "model" turn from its view.
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Map<String, String> turn : history) {
            String role = "user".equals(turn.get("role")) ? "user" : "model";
            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(Map.of("text", turn.get("content")))
            ));
        }

        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                "contents", contents
        );

        String uri = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/" + model + ":generateContent")
                .queryParam("key", apiKey)
                .toUriString();

        try {
            Map<String, Object> response = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return null;
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) return null;

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return null;
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> part : parts) {
                if (part.get("text") != null) {
                    sb.append(part.get("text"));
                }
            }
            String text = sb.toString().trim();
            return text.isEmpty() ? null : text;
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return null;
        }
    }
}
