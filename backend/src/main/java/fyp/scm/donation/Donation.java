package fyp.scm.donation;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "donations")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Donation {

    public enum Status { PENDING, COMPLETE, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sent to eSewa as transaction_uuid; how the callback finds this row.
    @Column(unique = true, nullable = false)
    private String transactionUuid;

    // Whole rupees. Donations carry no tax/service/delivery charges, so this
    // is also the eSewa total_amount.
    @Column(nullable = false)
    private Long amount;

    private String donorName;

    @Column(length = 500)
    private String message;

    // Who is receiving this donation (set from config at record time).
    private String recipientName;

    private String recipientPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    // eSewa's transaction_code, set once the payment completes.
    private String esewaTransactionCode;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
