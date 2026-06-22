package fyp.scm.blog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBlogRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 150, message = "Title must be 5-150 characters")
    private String title;

    @Size(max = 500, message = "Cover image URL is too long")
    private String coverImageUrl;

    @Size(max = 220, message = "Excerpt must be under 220 characters")
    private String excerpt;

    @NotBlank(message = "Content is required")
    private String content;
}
