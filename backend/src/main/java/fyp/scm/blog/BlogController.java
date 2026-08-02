package fyp.scm.blog;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    // Public — anyone can read the blog list
    @GetMapping
    public Page<BlogResponse> getAllBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size
    ) {
        return blogService.getAllBlogs(PageRequest.of(page, size));
    }

    // Public — anyone can read a single post
    @GetMapping("/{id}")
    public BlogResponse getBlog(@PathVariable Long id) {
        return blogService.getBlog(id);
    }

    // Authenticated — any role can see their own posts
    @GetMapping("/my")
    public List<BlogResponse> getMyBlogs(Authentication authentication) {
        return blogService.getMyBlogs(authentication.getName());
    }

    // Authenticated — any logged-in role can publish.
    // multipart/form-data: JSON payload in the "data" part, image file in "coverImage".
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BlogResponse> createBlog(
            Authentication authentication,
            @Valid @RequestPart("data") CreateBlogRequest request,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        BlogResponse created = blogService.createBlog(authentication.getName(), request, coverImage);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Authenticated — only the original author can edit.
    // multipart/form-data: JSON payload in the "data" part, optional new image in "coverImage".
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BlogResponse updateBlog(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestPart("data") CreateBlogRequest request,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        return blogService.updateBlog(authentication.getName(), id, request, coverImage);
    }

    // Authenticated — only the original author can delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(Authentication authentication, @PathVariable Long id) {
        blogService.deleteBlog(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // Local exception handling — merge into GlobalExceptionHandler instead
    // if you'd rather keep all error mapping centralized.
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
    }
}
