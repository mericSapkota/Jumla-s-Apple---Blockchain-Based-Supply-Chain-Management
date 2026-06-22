package fyp.scm.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogResponse {
    private Long id;
    private String title;
    private String coverImageUrl;
    private String excerpt;
    private String content;
    private String authorEmail;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BlogResponse from(BlogPost post) {
        return new BlogResponse(
                post.getId(),
                post.getTitle(),
                post.getCoverImageUrl(),
                post.getExcerpt(),
                post.getContent(),
                post.getAuthorEmail(),
                post.getAuthorName(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
