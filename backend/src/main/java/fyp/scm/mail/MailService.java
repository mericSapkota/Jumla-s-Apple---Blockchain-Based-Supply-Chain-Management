package fyp.scm.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String fullName, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Verify your Jumla Trace account");
            helper.setText("""
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                        <h2>Welcome to Jumla Trace, %s!</h2>
                        <p>Please confirm your email address to activate your account.</p>
                        <p>
                            <a href="%s" style="display:inline-block; padding:12px 24px; background:#2e7d32;
                               color:#fff; text-decoration:none; border-radius:8px;">
                                Verify my email
                            </a>
                        </p>
                        <p>Or paste this link into your browser:<br>%s</p>
                        <p style="color:#888; font-size:12px;">This link expires in 24 hours. If you didn't
                            create an account, you can ignore this email.</p>
                    </div>
                    """.formatted(fullName, verificationLink, verificationLink), true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", to, e);
        }
    }
}
