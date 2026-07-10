package fyp.scm.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByWalletAddress(String walletAddress);
    Optional<User> findByVerificationToken(String verificationToken);
    long countByRole(Role role);
}