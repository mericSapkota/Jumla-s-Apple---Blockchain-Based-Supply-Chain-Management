package fyp.scm.batch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<BatchEntity, String> {

    List<BatchEntity> findByFarmerEmail(String farmerEmail);

    List<BatchEntity> findByStatus(BatchStatus status);

    Optional<BatchEntity> findByBatchId(String batchId);

    boolean existsByBatchId(String batchId);
}