package fyp.scm.blog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlogRepository extends JpaRepository<BlogPost, Long> {
    Page<BlogPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<BlogPost> findByAuthorEmailOrderByCreatedAtDesc(String authorEmail);
}
