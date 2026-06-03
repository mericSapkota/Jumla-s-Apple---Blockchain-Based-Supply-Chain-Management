package fyp.scm.qr;



import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/batch/qr")
public class QRController {

    // The base URL of your React frontend consumer scan page
    // e.g. http://localhost:5173/consumer/scan?batchId=JML-2025-0042
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ── GET /api/batch/qr/{batchId} ───────────────────────────────────────
    // Public — returns a PNG QR code image
    // The QR code encodes the full consumer trace URL
    @GetMapping(value = "/{batchId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateQRCode(@PathVariable String batchId)
            throws WriterException, IOException {

        // The URL encoded in the QR — consumer scans this to see trace
        String traceUrl = frontendUrl + "/consumer/scan?batchId=" + batchId;

        byte[] qrBytes = createQRCodePng(traceUrl, 300, 300);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        // Tell browser to display inline (for React <img src="..."> usage)
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"qr-" + batchId + ".png\"");

        log.info("QR code generated for batch: {}", batchId);
        return ResponseEntity.ok().headers(headers).body(qrBytes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PRIVATE — ZXing QR generation logic
    // ─────────────────────────────────────────────────────────────────────────
    private byte[] createQRCodePng(String content, int width, int height)
            throws WriterException, IOException {

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H); // high error correction
        hints.put(EncodeHintType.MARGIN, 2);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return outputStream.toByteArray();
    }
}