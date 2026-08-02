package fyp.scm.chat;

/** Thrown when a visitor tries to chat while the admin has turned the AI off. */
public class ChatDisabledException extends RuntimeException {
    public ChatDisabledException(String message) {
        super(message);
    }
}
