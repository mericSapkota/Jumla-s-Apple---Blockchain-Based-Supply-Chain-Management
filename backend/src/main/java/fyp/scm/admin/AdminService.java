package fyp.scm.admin;

import fyp.scm.batch.BatchEntity;
import fyp.scm.batch.BatchRepository;
import fyp.scm.batch.BatchStatus;
import fyp.scm.blog.BlogPost;
import fyp.scm.blog.BlogRepository;
import fyp.scm.donation.Donation;
import fyp.scm.donation.DonationRepository;
import fyp.scm.mail.MailService;
import fyp.scm.user.ApprovalStatus;
import fyp.scm.user.Role;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final BlogRepository blogRepository;
    private final DonationRepository donationRepository;
    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.verification.token-expiry-hours}")
    private long verificationTokenExpiryHours;

    // ── analytics ─────────────────────────────────

    public Map<String, Object> analytics() {
        List<User> users = userRepository.findAll();
        List<BatchEntity> batches = batchRepository.findAll();
        List<Donation> donations = donationRepository.findAll();

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            usersByRole.put(role.name(), users.stream().filter(u -> u.getRole() == role).count());
        }

        Map<String, Long> batchesByStatus = new LinkedHashMap<>();
        for (BatchStatus status : BatchStatus.values()) {
            batchesByStatus.put(status.name(), batches.stream().filter(b -> b.getStatus() == status).count());
        }

        List<Donation> completed = donations.stream()
                .filter(d -> d.getStatus() == Donation.Status.COMPLETE)
                .toList();
        long donationTotal = completed.stream().mapToLong(Donation::getAmount).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", users.size());
        result.put("usersByRole", usersByRole);
        result.put("totalBatches", batches.size());
        result.put("batchesByStatus", batchesByStatus);
        result.put("totalBlogs", blogRepository.count());
        result.put("totalDonations", donations.size());
        result.put("completedDonations", completed.size());
        result.put("donationTotal", donationTotal);
        result.put("signupsByMonth", groupByMonth(users.stream()
                .map(User::getCreatedAt).filter(java.util.Objects::nonNull).toList()));
        result.put("donationsByMonth", groupByMonth(completed.stream()
                .map(Donation::getCreatedAt).filter(java.util.Objects::nonNull).toList()));
        return result;
    }

    // Buckets timestamps into the last 12 calendar months (oldest first),
    // zero-filling empty months so charts get a continuous axis.
    private Map<String, Long> groupByMonth(List<Instant> instants) {
        ZoneId zone = ZoneId.systemDefault();
        YearMonth now = YearMonth.now(zone);
        Map<String, Long> buckets = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            buckets.put(now.minusMonths(i).toString(), 0L);
        }
        for (Instant instant : instants) {
            String key = YearMonth.from(instant.atZone(zone)).toString();
            buckets.computeIfPresent(key, (k, v) -> v + 1);
        }
        return buckets;
    }

    // ── users ─────────────────────────────────────

    public List<AdminUserResponse> listUsers(String role, String search) {
        return userRepository.findAll().stream()
                .filter(u -> role == null || role.isBlank() || u.getRole().name().equalsIgnoreCase(role))
                .filter(u -> search == null || search.isBlank()
                        || u.getEmail().toLowerCase().contains(search.toLowerCase())
                        || u.getFullName().toLowerCase().contains(search.toLowerCase()))
                .sorted(Comparator.comparing(User::getId).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteUser(Long id, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() == Role.SUPERADMIN) {
            throw new IllegalArgumentException("Superadmin accounts cannot be deleted");
        }
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        userRepository.delete(user);
    }

    @Transactional
    public AdminUserResponse verifyUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
        return toResponse(user);
    }

    // ── approvals (cooperative / transporter) ─────

    /**
     * Approves a pending account. For email/password accounts this is the point
     * at which the verification email is finally sent; Google accounts are
     * already email-verified, so they just get a short "you're approved" note.
     */
    @Transactional
    public AdminUserResponse approveUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean wasNotApproved = !user.isApproved();
        user.setApprovalStatus(ApprovalStatus.APPROVED);

        if (wasNotApproved) {
            if ("GOOGLE".equals(user.getAuthProvider())) {
                user.setEmailVerified(true);
                userRepository.save(user);
                mailService.sendApprovalEmail(user.getEmail(), user.getFullName(), frontendUrl + "/login");
            } else if (!user.isEmailVerified()) {
                // Now issue the verification token and finally send the email.
                user.setVerificationToken(UUID.randomUUID().toString());
                user.setVerificationTokenExpiry(Instant.now().plus(verificationTokenExpiryHours, ChronoUnit.HOURS));
                userRepository.save(user);
                String link = frontendUrl + "/verify-email?token=" + user.getVerificationToken();
                mailService.sendVerificationEmail(user.getEmail(), user.getFullName(), link);
            } else {
                userRepository.save(user);
            }
        }
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse rejectUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setApprovalStatus(ApprovalStatus.REJECTED);
        userRepository.save(user);
        return toResponse(user);
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .dateOfBirth(user.getDateOfBirth())
                .profilePicturePath(user.getProfilePicturePath())
                .walletAddress(user.getWalletAddress())
                .emailVerified(user.isEmailVerified())
                .approvalStatus(user.getApprovalStatus() == null
                        ? ApprovalStatus.APPROVED.name()
                        : user.getApprovalStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── data oversight (read-only lists + blog moderation) ──

    public List<BatchEntity> listBatches() {
        return batchRepository.findAll().stream()
                .sorted(Comparator.comparing(BatchEntity::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<Donation> listDonations() {
        return donationRepository.findAll().stream()
                .sorted(Comparator.comparing(Donation::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<BlogPost> listBlogs() {
        return blogRepository.findAll().stream()
                .sorted(Comparator.comparing(BlogPost::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public void deleteBlog(Long id) {
        if (!blogRepository.existsById(id)) {
            throw new IllegalArgumentException("Blog post not found");
        }
        blogRepository.deleteById(id);
    }
}
