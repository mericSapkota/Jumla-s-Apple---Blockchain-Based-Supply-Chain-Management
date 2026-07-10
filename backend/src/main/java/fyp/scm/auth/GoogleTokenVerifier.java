package fyp.scm.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * Verifies a Google Identity Services ID token (the "credential" the frontend
 * button hands us): checks Google's signature and that the token was issued
 * for our OAuth client ID, then exposes the verified email + name.
 */
@Component
public class GoogleTokenVerifier {

    public record GoogleUser(String email, String fullName) {}

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.client-id}") String clientId) throws Exception {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                GoogleNetHttpTransport.newTrustedTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleUser verify(String credential) {
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(credential);
        } catch (Exception e) {
            // Malformed/forged tokens throw all kinds of parse errors — never
            // surface library internals to the client.
            throw new RuntimeException("Invalid Google credential");
        }
        if (idToken == null) {
            throw new RuntimeException("Invalid Google credential");
        }
        GoogleIdToken.Payload payload = idToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new RuntimeException("Google account email is not verified");
        }
        String name = (String) payload.get("name");
        return new GoogleUser(payload.getEmail(), name != null ? name : payload.getEmail());
    }
}
