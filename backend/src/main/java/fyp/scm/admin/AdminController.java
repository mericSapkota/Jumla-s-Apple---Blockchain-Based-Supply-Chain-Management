package fyp.scm.admin;

import fyp.scm.batch.BatchEntity;
import fyp.scm.blog.BlogPost;
import fyp.scm.donation.Donation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Every route here requires ROLE_SUPERADMIN — see SecurityConfig.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics() {
        return ResponseEntity.ok(adminService.analytics());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> users(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.listUsers(role, search));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        adminService.deleteUser(id, principal.getUsername());
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<AdminUserResponse> verifyUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.verifyUser(id));
    }

    @GetMapping("/batches")
    public ResponseEntity<List<BatchEntity>> batches() {
        return ResponseEntity.ok(adminService.listBatches());
    }

    @GetMapping("/donations")
    public ResponseEntity<List<Donation>> donations() {
        return ResponseEntity.ok(adminService.listDonations());
    }

    @GetMapping("/blogs")
    public ResponseEntity<List<BlogPost>> blogs() {
        return ResponseEntity.ok(adminService.listBlogs());
    }

    @DeleteMapping("/blogs/{id}")
    public ResponseEntity<Map<String, String>> deleteBlog(@PathVariable Long id) {
        adminService.deleteBlog(id);
        return ResponseEntity.ok(Map.of("message", "Blog post deleted"));
    }
}
