package fyp.scm;

import com.fasterxml.jackson.databind.ObjectMapper;
import fyp.scm.auth.AuthRequest;
import fyp.scm.auth.AuthResponse;
import fyp.scm.auth.RegisterRequest;
import fyp.scm.user.Role;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Auth endpoint integration tests.
 * Uses H2 in-memory DB (src/test/resources/application.properties).
 * @Transactional rolls back DB after each test — no DirtiesContext needed.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional                   // ← rolls back after each test, keeps context alive
@DisplayName("Auth API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final String FARMER_EMAIL    = "ram@jumla.com";
    private static final String FARMER_PASSWORD = "password123";
    private static final String FARMER_NAME     = "Ram Bahadur";

    // ═════════════════════════════════════════════
    //  REGISTER
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("POST /api/auth/register")
    @Transactional
    class RegisterTests {

        @Test
        @Order(1)
        @DisplayName("should register new user and return JWT token")
        void shouldRegisterUser() throws Exception {
            RegisterRequest req = buildRegisterRequest(FARMER_EMAIL, FARMER_PASSWORD, FARMER_NAME, Role.FARMER);

            MvcResult result = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.role").value("FARMER"))
                    .andExpect(jsonPath("$.fullName").value(FARMER_NAME))
                    .andReturn();

            // Verify saved in DB
            assertThat(userRepository.findByEmail(FARMER_EMAIL)).isPresent();

            // Verify password is hashed
            User saved = userRepository.findByEmail(FARMER_EMAIL).get();
            assertThat(saved.getPassword()).isNotEqualTo(FARMER_PASSWORD);
            assertThat(passwordEncoder.matches(FARMER_PASSWORD, saved.getPassword())).isTrue();
        }

        @Test
        @Order(2)
        @DisplayName("should return 400 when email already registered")
        void shouldRejectDuplicateEmail() throws Exception {
            // Register once
            performRegister(buildRegisterRequest(FARMER_EMAIL, FARMER_PASSWORD, FARMER_NAME, Role.FARMER));

            // Same email again
            RegisterRequest dup = buildRegisterRequest(FARMER_EMAIL, "otherpass", "Other", Role.FARMER);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dup)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }

        @Test
        @Order(3)
        @DisplayName("should return 400 when email format is invalid")
        void shouldRejectInvalidEmail() throws Exception {
            RegisterRequest req = buildRegisterRequest("not-an-email", "pass123", "Test", Role.FARMER);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @Order(4)
        @DisplayName("should return 400 when required fields are blank")
        void shouldRejectBlankFields() throws Exception {
            RegisterRequest req = buildRegisterRequest(FARMER_EMAIL, "", "", Role.FARMER);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @Order(5)
        @DisplayName("should register all 4 role types")
        void shouldRegisterAllRoles() throws Exception {
            Role[] roles   = { Role.FARMER, Role.COOPERATIVE, Role.TRANSPORTER, Role.CONSUMER };
            String[] emails = { "farmer@j.com", "coop@j.com", "trans@j.com", "buyer@j.com" };

            for (int i = 0; i < roles.length; i++) {
                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        buildRegisterRequest(emails[i], "pass123", "User " + i, roles[i]))))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.role").value(roles[i].name()));
            }
        }
    }

    // ═════════════════════════════════════════════
    //  LOGIN
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("POST /api/auth/login")
    @Transactional
    class LoginTests {

        @BeforeEach
        void seedFarmer() throws Exception {
            performRegister(buildRegisterRequest(FARMER_EMAIL, FARMER_PASSWORD, FARMER_NAME, Role.FARMER));
        }

        @Test
        @Order(6)
        @DisplayName("should login and return JWT token with correct role")
        void shouldLoginSuccessfully() throws Exception {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildLoginRequest(FARMER_EMAIL, FARMER_PASSWORD))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.role").value("FARMER"))
                    .andExpect(jsonPath("$.fullName").value(FARMER_NAME))
                    .andReturn();

            String responseBody = result.getResponse().getContentAsString();
            AuthResponse authResponse = objectMapper.readValue(responseBody, AuthResponse.class);
            // Verify token has 3 JWT parts
            assertThat(authResponse.getToken().split("\\.")).hasSize(3);
        }

        @Test
        @Order(7)
        @DisplayName("should return 400 for wrong password")
        void shouldRejectWrongPassword() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildLoginRequest(FARMER_EMAIL, "WRONG_PASSWORD"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid password"));
        }

        @Test
        @Order(8)
        @DisplayName("should return 400 for non-existent email")
        void shouldRejectUnknownEmail() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildLoginRequest("nobody@jumla.com", FARMER_PASSWORD))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("User not found"));
        }

        @Test
        @Order(9)
        @DisplayName("should return 400 for invalid email format")
        void shouldRejectInvalidEmailFormat() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    buildLoginRequest("not-an-email", FARMER_PASSWORD))))
                    .andExpect(status().isBadRequest());
        }
    }

    // ═════════════════════════════════════════════
    //  FULL FLOW
    // ═════════════════════════════════════════════
    @Test
    @Order(10)
    @DisplayName("Full flow: register then login should return same role")
    void registerThenLoginReturnsSameRole() throws Exception {
        performRegister(buildRegisterRequest("coop@jumla.com", "cooppass123", "Jumla Coop", Role.COOPERATIVE));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                buildLoginRequest("coop@jumla.com", "cooppass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("COOPERATIVE"))
                .andExpect(jsonPath("$.fullName").value("Jumla Coop"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private RegisterRequest buildRegisterRequest(String email, String password,
                                                 String name, Role role) {
        RegisterRequest req = new RegisterRequest();
        req.setFullName(name);
        req.setEmail(email);
        req.setPassword(password);
        req.setRole(role);
        return req;
    }

    private AuthRequest buildLoginRequest(String email, String password) {
        AuthRequest req = new AuthRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private void performRegister(RegisterRequest req) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)));
    }
}