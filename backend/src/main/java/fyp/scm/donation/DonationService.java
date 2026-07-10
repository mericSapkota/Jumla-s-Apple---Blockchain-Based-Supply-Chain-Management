package fyp.scm.donation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final DonationRepository donationRepository;
    private final ObjectMapper objectMapper;

    @Value("${esewa.form-url}")
    private String esewaFormUrl;

    @Value("${esewa.product-code}")
    private String productCode;

    @Value("${esewa.secret-key}")
    private String secretKey;

    @Value("${app.backend-url}")
    private String backendUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.donation.recipient-name}")
    private String recipientName;

    @Value("${app.donation.recipient-phone}")
    private String recipientPhone;

    /**
     * Creates a PENDING donation and returns the eSewa form URL plus every
     * field the frontend must POST to it. eSewa's v2 ePay flow is a signed
     * HTML form redirect: HMAC-SHA256 over
     * "total_amount=X,transaction_uuid=Y,product_code=Z", base64-encoded.
     */
    @Transactional
    public Map<String, Object> initiate(InitiateDonationRequest req) {
        String uuid = UUID.randomUUID().toString();
        String totalAmount = String.valueOf(req.getAmount());

        Donation donation = Donation.builder()
                .transactionUuid(uuid)
                .amount(req.getAmount())
                .donorName(req.getDonorName())
                .message(req.getMessage())
                .recipientName(recipientName)
                .recipientPhone(recipientPhone)
                .build();
        donationRepository.save(donation);

        String signature = sign("total_amount=" + totalAmount
                + ",transaction_uuid=" + uuid
                + ",product_code=" + productCode);

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("amount", totalAmount);
        fields.put("tax_amount", "0");
        fields.put("total_amount", totalAmount);
        fields.put("transaction_uuid", uuid);
        fields.put("product_code", productCode);
        fields.put("product_service_charge", "0");
        fields.put("product_delivery_charge", "0");
        fields.put("success_url", backendUrl + "/api/donations/success");
        // Path variable, not a query param — eSewa appends "?data=..." to this
        // URL on redirect, so it must not already contain a query string.
        fields.put("failure_url", backendUrl + "/api/donations/failure/" + uuid);
        fields.put("signed_field_names", "total_amount,transaction_uuid,product_code");
        fields.put("signature", signature);

        return Map.of("formUrl", esewaFormUrl, "fields", fields);
    }

    /**
     * Handles eSewa's redirect after payment: `data` is a base64-encoded JSON
     * body whose signature we must re-compute (over the response's
     * signed_field_names, as key=value pairs) before trusting the status.
     * Returns the frontend URL to bounce the donor's browser to, with encoded
     * donation details so the thank-you page can display them.
     */
    @Transactional
    public String handleSuccess(String data) {
        try {
            JsonNode body = objectMapper.readTree(decodeBase64(data));

            String uuid = body.path("transaction_uuid").asText();
            Donation donation = donationRepository.findByTransactionUuid(uuid)
                    .orElseThrow(() -> new IllegalStateException("Unknown transaction " + uuid));

            // A completed donation is final — a replayed or tampered callback
            // must never downgrade it.
            if (donation.getStatus() == Donation.Status.COMPLETE) {
                return buildSuccessUrl(donation);
            }

            if (!verifyResponseSignature(body)) {
                log.warn("eSewa response signature mismatch for donation {}", uuid);
                return frontendUrl + "/donate?status=failed";
            }

            if (!"COMPLETE".equalsIgnoreCase(body.path("status").asText())) {
                donation.setStatus(Donation.Status.FAILED);
                donationRepository.save(donation);
                return frontendUrl + "/donate?status=failed";
            }

            donation.setStatus(Donation.Status.COMPLETE);
            donation.setEsewaTransactionCode(body.path("transaction_code").asText());
            donationRepository.save(donation);
            return buildSuccessUrl(donation);

        } catch (Exception e) {
            log.error("Failed to process eSewa success callback", e);
            return frontendUrl + "/donate?status=failed";
        }
    }

    private String buildSuccessUrl(Donation donation) {
        try {
            DonationResponse resp = DonationResponse.builder()
                    .amount(donation.getAmount())
                    .recipientName(donation.getRecipientName())
                    .recipientPhone(donation.getRecipientPhone())
                    .message(donation.getMessage())
                    .build();
            String encoded = java.net.URLEncoder.encode(
                    objectMapper.writeValueAsString(resp), "UTF-8");
            return frontendUrl + "/donate?status=success&data=" + encoded;
        } catch (Exception e) {
            log.warn("Could not encode donation response", e);
            return frontendUrl + "/donate?status=success&amount=" + donation.getAmount();
        }
    }

    @Transactional
    public String handleFailure(String uuid) {
        donationRepository.findByTransactionUuid(uuid).ifPresent(d -> {
            if (d.getStatus() == Donation.Status.PENDING) {
                d.setStatus(Donation.Status.FAILED);
                donationRepository.save(d);
            }
        });
        return frontendUrl + "/donate?status=failed";
    }

    // ── helpers ──────────────────────────────────

    private boolean verifyResponseSignature(JsonNode body) {
        String[] fieldNames = body.path("signed_field_names").asText().split(",");
        StringBuilder message = new StringBuilder();
        for (String field : fieldNames) {
            if (!message.isEmpty()) message.append(",");
            message.append(field).append("=").append(body.path(field).asText());
        }
        return sign(message.toString()).equals(body.path("signature").asText());
    }

    private String sign(String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder()
                    .encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not compute eSewa signature", e);
        }
    }

    private byte[] decodeBase64(String data) {
        // eSewa's redirect may arrive with either standard or URL-safe base64,
        // and '+' can turn into a space in query-string transit.
        String cleaned = data.trim().replace(' ', '+');
        try {
            return Base64.getDecoder().decode(cleaned);
        } catch (IllegalArgumentException e) {
            return Base64.getUrlDecoder().decode(data.trim());
        }
    }
}
