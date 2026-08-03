package fyp.scm.user;

/**
 * Admin approval state for a self-registered account.
 *
 * Cooperative and transporter registrations start as {@link #PENDING} and can
 * only log in (and only receive their verification email) once an admin sets
 * them to {@link #APPROVED}. Farmers/consumers are auto-approved. A null value
 * on legacy rows is treated as approved — see {@code User#isApproved()}.
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
