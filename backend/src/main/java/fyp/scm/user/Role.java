package fyp.scm.user;


public enum Role {
    FARMER,
    COOPERATIVE,
    TRANSPORTER,
    CONSUMER,
    // Not self-registerable — seeded at startup by AdminSeeder and rejected
    // by AuthService.register.
    SUPERADMIN
}