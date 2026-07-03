package fyp.scm.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Writes uploaded files (currently just profile pictures) physically onto the
 * FRONTEND project's directory, so Vite/the static file server can serve them
 * directly. The backend/database only ever stores the relative path that is
 * returned from {@link #storeProfilePicture(MultipartFile)} — never the bytes.
 *
 * Configure the absolute path to the frontend's `public` folder via
 * `app.upload.frontend-public-dir` in application.properties, e.g.:
 *   app.upload.frontend-public-dir=/Users/you/jumla-frontend/public
 *
 * The file ends up on disk at:
 *   {frontend-public-dir}/uploads/profiles/{uuid}.{ext}
 * and is reachable in the browser at:
 *   {app.upload.url-prefix}/{uuid}.{ext}   (served by Vite straight out of /public)
 */
@Slf4j
@Service
public class FileStorageService {

    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "webp");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    @Value("${app.upload.frontend-public-dir}")
    private String frontendPublicDir;

    @Value("${app.upload.url-prefix:/uploads/profiles}")
    private String urlPrefix;

    public String storeProfilePicture(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile picture file is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Profile picture must be 5MB or smaller");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only JPG, PNG, or WEBP images are allowed");
        }

        try {
            Path targetDir = Paths.get(frontendPublicDir, "uploads", "profiles");
            Files.createDirectories(targetDir);

            String filename = UUID.randomUUID() + "." + extension;
            Path targetFile = targetDir.resolve(filename);

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored profile picture at {}", targetFile);

            // This relative path (NOT the absolute disk path) is what gets saved in the DB.
            return urlPrefix + "/" + filename;
        } catch (IOException e) {
            log.error("Failed to store profile picture: {}", e.getMessage());
            throw new RuntimeException("Could not save profile picture: " + e.getMessage());
        }
    }

    /** Deletes a previously stored profile picture, given the relative path saved in the DB. */
    public void deleteProfilePicture(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            String filename = relativePath.substring(relativePath.lastIndexOf('/') + 1);
            Path target = Paths.get(frontendPublicDir, "uploads", "profiles", filename);
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete old profile picture {}: {}", relativePath, e.getMessage());
        }
    }
}
