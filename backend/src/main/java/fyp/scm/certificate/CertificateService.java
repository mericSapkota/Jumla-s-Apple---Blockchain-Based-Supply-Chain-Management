package fyp.scm.certificate;

import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Generates a downloadable PDF certificate for FARMER / TRANSPORTER /
 * COOPERATIVE users once they have completed at least 5 confirmed
 * blockchain transactions (see BlockchainTransactionLog).
 *
 * Requires the PDFBox dependency in pom.xml:

 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    public static final long REQUIRED_TRANSACTIONS = 5;

    private final BlockchainTransactionLogRepository transactionLogRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

    public CertificateStatusResponse getStatus(String email) {
        long count = transactionLogRepository.countByUserEmail(email);
        var existing = certificateRepository.findByUserEmail(email);

        return CertificateStatusResponse.builder()
                .eligible(count >= REQUIRED_TRANSACTIONS)
                .transactionCount(count)
                .requiredTransactions(REQUIRED_TRANSACTIONS)
                .alreadyIssued(existing.isPresent())
                .certificateNumber(existing.map(Certificate::getCertificateNumber).orElse(null))
                .issuedAt(existing.map(Certificate::getIssuedAt).orElse(null))
                .build();
    }

    @Transactional
    public byte[] generateCertificatePdf(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long count = transactionLogRepository.countByUserEmail(email);
        if (count < REQUIRED_TRANSACTIONS) {
            throw new RuntimeException(
                    "Not eligible yet — " + count + "/" + REQUIRED_TRANSACTIONS +
                            " blockchain transactions completed");
        }

        // Idempotent: reuse the existing certificate number if already issued,
        // otherwise mint a new one and persist it.
        Certificate certificate = certificateRepository.findByUserEmail(email)
                .orElseGet(() -> certificateRepository.save(
                        Certificate.builder()
                                .certificateNumber(generateCertificateNumber())
                                .userEmail(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole().name())
                                .transactionCountAtIssue(count)
                                .build()));

        return renderPdf(user, certificate, count);
    }

    private String generateCertificateNumber() {
        int year = java.time.LocalDate.now().getYear();
        String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "JML-CERT-" + year + "-" + suffix;
    }

    private byte[] renderPdf(User user, Certificate certificate, long txCount) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Border
                cs.setLineWidth(3f);
                cs.setStrokingColor(34, 95, 56); // forest green, matches "Jumla Trace" brand
                cs.addRect(30, 30, pageWidth - 60, pageHeight - 60);
                cs.stroke();

                cs.setLineWidth(0.75f);
                cs.addRect(40, 40, pageWidth - 80, pageHeight - 80);
                cs.stroke();

                PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                PDType1Font italic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

                centerText(cs, bold, 22, "JUMLA TRACE", pageWidth, pageHeight - 110);
                centerText(cs, regular, 11, "Blockchain Apple Supply Chain", pageWidth, pageHeight - 130);

                centerText(cs, bold, 26, "Certificate of Blockchain Participation", pageWidth, pageHeight - 190);

                centerText(cs, regular, 12, "This certifies that", pageWidth, pageHeight - 240);
                centerText(cs, bold, 20, user.getFullName(), pageWidth, pageHeight - 270);

                String roleLabel = switch (user.getRole().name()) {
                    case "FARMER" -> "Farmer";
                    case "COOPERATIVE" -> "Cooperative";
                    case "TRANSPORTER" -> "Transporter";
                    default -> user.getRole().name();
                };

                centerText(cs, regular, 12,
                        "has successfully completed " + txCount + " verified blockchain transactions",
                        pageWidth, pageHeight - 305);
                centerText(cs, regular, 12,
                        "as a registered " + roleLabel + " on the Jumla Trace network.",
                        pageWidth, pageHeight - 323);

                centerText(cs, italic, 10, "Certificate No: " + certificate.getCertificateNumber(),
                        pageWidth, pageHeight - 380);
                centerText(cs, italic, 10,
                        "Issued on: " + certificate.getIssuedAt().format(DateTimeFormatter.ofPattern("MMMM d, yyyy")),
                        pageWidth, pageHeight - 396);

                centerText(cs, italic, 9,
                        "Verifiable on-chain via the transaction hashes recorded against this account.",
                        pageWidth, pageHeight - 430);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to render certificate PDF: {}", e.getMessage());
            throw new RuntimeException("Could not generate certificate: " + e.getMessage());
        }
    }

    private void centerText(PDPageContentStream cs, PDType1Font font, float fontSize,
                             String text, float pageWidth, float y) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = (pageWidth - textWidth) / 2;
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}
