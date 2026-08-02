package fyp.scm.blog;

import fyp.scm.storage.FileStorageService;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public Page<BlogResponse> getAllBlogs(Pageable pageable) {
        return blogRepository.findAllByOrderByCreatedAtDesc(pageable).map(BlogResponse::from);
    }

    public BlogResponse getBlog(Long id) {
        BlogPost post = blogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Blog post not found: " + id));
        return BlogResponse.from(post);
    }

    public List<BlogResponse> getMyBlogs(String authorEmail) {
        return blogRepository.findByAuthorEmailOrderByCreatedAtDesc(authorEmail)
                .stream()
                .map(BlogResponse::from)
                .toList();
    }

    public BlogResponse createBlog(String authorEmail, CreateBlogRequest request, MultipartFile coverImage) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + authorEmail));

        BlogPost post = new BlogPost();
        post.setTitle(request.getTitle());
        post.setCoverImageUrl(resolveCoverImage(coverImage, request.getCoverImageUrl()));
        post.setExcerpt(request.getExcerpt());
        post.setContent(request.getContent());
        post.setAuthorEmail(authorEmail);
        post.setAuthorName(author.getFullName());

        BlogPost saved = blogRepository.save(post);
        return BlogResponse.from(saved);
    }

    public BlogResponse updateBlog(String requesterEmail, Long id, CreateBlogRequest request, MultipartFile coverImage) {
        BlogPost post = blogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Blog post not found: " + id));

        if (!post.getAuthorEmail().equals(requesterEmail)) {
            throw new SecurityException("You can only edit your own posts");
        }

        post.setTitle(request.getTitle());
        // A new upload replaces the old image; otherwise keep whatever the post already had.
        if (coverImage != null && !coverImage.isEmpty()) {
            String oldImage = post.getCoverImageUrl();
            post.setCoverImageUrl(fileStorageService.storeBlogImage(coverImage));
            if (oldImage != null && oldImage.startsWith("/uploads/blogs/")) {
                fileStorageService.deleteBlogImage(oldImage);
            }
        }
        post.setExcerpt(request.getExcerpt());
        post.setContent(request.getContent());

        BlogPost saved = blogRepository.save(post);
        return BlogResponse.from(saved);
    }

    /**
     * If an image file was uploaded, store it and use its path. Otherwise fall back
     * to any coverImageUrl string supplied in the JSON (kept for backwards
     * compatibility / optional external URLs), which may be null.
     */
    private String resolveCoverImage(MultipartFile coverImage, String fallbackUrl) {
        if (coverImage != null && !coverImage.isEmpty()) {
            return fileStorageService.storeBlogImage(coverImage);
        }
        return fallbackUrl;
    }

    public void deleteBlog(String requesterEmail, Long id) {
        BlogPost post = blogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Blog post not found: " + id));

        if (!post.getAuthorEmail().equals(requesterEmail)) {
            throw new SecurityException("You can only delete your own posts");
        }

        blogRepository.delete(post);
    }
}
