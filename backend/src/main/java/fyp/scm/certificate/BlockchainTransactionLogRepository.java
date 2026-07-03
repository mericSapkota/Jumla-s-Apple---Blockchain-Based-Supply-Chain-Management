package fyp.scm.certificate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlockchainTransactionLogRepository extends JpaRepository<BlockchainTransactionLog, Long> {
    long countByUserEmail(String userEmail);
}
