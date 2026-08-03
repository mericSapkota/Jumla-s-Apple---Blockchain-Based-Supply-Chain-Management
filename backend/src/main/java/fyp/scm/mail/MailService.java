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

    /**
     * Sent to Google-authenticated cooperative/transporter accounts once an
     * admin approves them — they don't need email verification, so this just
     * tells them they can now sign in.
     */
    public void sendApprovalEmail(String to, String fullName, String loginLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Your Jumla Trace account has been approved");
            helper.setText("""
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                        <h2>Good news, %s!</h2>
                        <p>An administrator has approved your Jumla Trace account. You can now sign in.</p>
                        <p>
                            <a href="%s" style="display:inline-block; padding:12px 24px; background:#2e7d32;
                               color:#fff; text-decoration:none; border-radius:8px;">
                                Sign in
                            </a>
                        </p>
                        <p>Or paste this link into your browser:<br>%s</p>
                    </div>
                    """.formatted(fullName, loginLink, loginLink), true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send approval email to {}", to, e);
        }
    }

    public void sendTwoFactorCode(String to, String fullName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Your Jumla Trace login code");
            helper.setText("""
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                        <h2>Hi %s,</h2>
                        <p>Your one-time login code is:</p>
                        <p style="font-size:32px; font-weight:bold; letter-spacing:8px;">%s</p>
                        <p style="color:#888; font-size:12px;">This code expires in 5 minutes. If you didn't
                            try to log in, change your password immediately.</p>
                    </div>
                    """.formatted(fullName, code), true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send 2FA code to {}", to, e);
        }
    }
}
