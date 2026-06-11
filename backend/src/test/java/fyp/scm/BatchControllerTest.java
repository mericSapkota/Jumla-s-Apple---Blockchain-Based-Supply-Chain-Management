package fyp.scm;




import com.fasterxml.jackson.databind.ObjectMapper;
import fyp.scm.batch.*;
import fyp.scm.security.JwtUtil;
import fyp.scm.user.Role;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("BatchController API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BatchControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @MockBean private BatchService batchService;

    private String farmerToken;
    private String cooperativeToken;
    private String transporterToken;

    private BatchResponse mockResponse;
    private static final String BATCH_ID = "JML-2025-AB12";

    @BeforeEach
    void setUp() {
        // ── Seed test users into H2 so JwtAuthFilter can load them ──────────
        User farmer = createAndSaveUser("ram@jumla.com",    "Ram Bahadur",   Role.FARMER);
        User coop   = createAndSaveUser("coop@jumla.com",   "Jumla Coop",    Role.COOPERATIVE);
        User driver = createAndSaveUser("driver@jumla.com", "Hari Driver",   Role.TRANSPORTER);

        // ── Generate JWT tokens for each role ────────────────────────────────
        farmerToken      = "Bearer " + jwtUtil.generateToken(farmer);
        cooperativeToken = "Bearer " + jwtUtil.generateToken(coop);
        transporterToken = "Bearer " + jwtUtil.generateToken(driver);

        // ── Reusable mock response ────────────────────────────────────────────
        mockResponse = BatchResponse.builder()
                .batchId(BATCH_ID)
                .farmerName("Ram Bahadur")
                .farmerEmail("ram@jumla.com")
                .farmLocation("Jumla, Karnali Province")
                .appleVariety("Fuji")
                .weightKg(450L)
                .harvestDate(LocalDateTime.now().minusDays(1))
                .status("HARVESTED")
                .aiResult("FRESH")
                .ipfsHash("QmTest123")
                .txHashCreate("0xabc123")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .transitHistory(List.of())
                .build();
    }

    // ── Helper: create user in H2 ─────────────────────────────────────────────
    private User createAndSaveUser(String email, String name, Role role) {
        // avoid duplicate if test re-runs in same transaction
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = User.builder()
                    .email(email)
                    .fullName(name)
                    .role(role)
                    .password(passwordEncoder.encode("pass123"))
                    .build();
            return userRepository.save(u);
        });
    }

    // ═════════════════════════════════════════════
    //  POST /api/batch/create
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("POST /api/batch/create")
    class CreateBatchEndpoint {

        @Test @Order(1)
        @DisplayName("should return 200 when FARMER creates batch")
        void farmerCanCreate() throws Exception {
            when(batchService.createBatch(any(), eq("ram@jumla.com")))
                    .thenReturn(mockResponse);

            mockMvc.perform(post("/api/batch/create")
                            .header("Authorization", farmerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCreateRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.batchId").value(BATCH_ID))
                    .andExpect(jsonPath("$.status").value("HARVESTED"));
        }

        @Test @Order(2)
        @DisplayName("should return 403 when COOPERATIVE tries to create batch")
        void cooperativeCannotCreate() throws Exception {
            mockMvc.perform(post("/api/batch/create")
                            .header("Authorization", cooperativeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test @Order(3)
        @DisplayName("should return 403 when no token provided")
        void noTokenReturns403() throws Exception {
            mockMvc.perform(post("/api/batch/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test @Order(4)
        @DisplayName("should return 400 when required fields are missing")
        void missingFieldsReturns400() throws Exception {
            mockMvc.perform(post("/api/batch/create")
                            .header("Authorization", farmerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ═════════════════════════════════════════════
    //  PUT /api/batch/certify/{id}
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("PUT /api/batch/certify/{id}")
    class CertifyBatchEndpoint {

        @Test @Order(5)
        @DisplayName("should return 200 when COOPERATIVE certifies")
        void cooperativeCanCertify() throws Exception {
            BatchResponse certified = BatchResponse.builder()
                    .batchId(BATCH_ID).status("CERTIFIED")
                    .txHashCertify("0xdef456").build();
            when(batchService.certifyBatch(BATCH_ID)).thenReturn(certified);

            mockMvc.perform(put("/api/batch/certify/" + BATCH_ID)
                            .header("Authorization", cooperativeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CERTIFIED"));
        }

        @Test @Order(6)
        @DisplayName("should return 403 when FARMER tries to certify")
        void farmerCannotCertify() throws Exception {
            mockMvc.perform(put("/api/batch/certify/" + BATCH_ID)
                            .header("Authorization", farmerToken))
                    .andExpect(status().isForbidden());
        }

        @Test @Order(7)
        @DisplayName("should return 400 when batch not in HARVESTED status")
        void alreadyCertifiedReturns400() throws Exception {
            when(batchService.certifyBatch(BATCH_ID))
                    .thenThrow(new RuntimeException("Batch must be in HARVESTED status"));

            mockMvc.perform(put("/api/batch/certify/" + BATCH_ID)
                            .header("Authorization", cooperativeToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    // ═════════════════════════════════════════════
    //  PUT /api/batch/transit/{id}
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("PUT /api/batch/transit/{id}")
    class TransitEndpoint {

        @Test @Order(8)
        @DisplayName("should return 200 when TRANSPORTER updates transit")
        void transporterCanUpdateTransit() throws Exception {
            BatchResponse inTransit = BatchResponse.builder()
                    .batchId(BATCH_ID).status("IN_TRANSIT").destination("Kathmandu").build();
            when(batchService.updateTransit(eq(BATCH_ID), any())).thenReturn(inTransit);

            mockMvc.perform(put("/api/batch/transit/" + BATCH_ID)
                            .header("Authorization", transporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    transitRequest("Nepalgunj", "Kathmandu"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("IN_TRANSIT"));
        }

        @Test @Order(9)
        @DisplayName("should return 403 when FARMER tries to update transit")
        void farmerCannotUpdateTransit() throws Exception {
            mockMvc.perform(put("/api/batch/transit/" + BATCH_ID)
                            .header("Authorization", farmerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    transitRequest("Nepalgunj", "Kathmandu"))))
                    .andExpect(status().isForbidden());
        }
    }

    // ═════════════════════════════════════════════
    //  PUT /api/batch/deliver/{id}
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("PUT /api/batch/deliver/{id}")
    class DeliverEndpoint {

        @Test @Order(10)
        @DisplayName("should return 200 when TRANSPORTER delivers")
        void transporterCanDeliver() throws Exception {
            BatchResponse delivered = BatchResponse.builder()
                    .batchId(BATCH_ID).status("DELIVERED").txHashDeliver("0xghi789").build();
            when(batchService.deliverBatch(BATCH_ID)).thenReturn(delivered);

            mockMvc.perform(put("/api/batch/deliver/" + BATCH_ID)
                            .header("Authorization", transporterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("DELIVERED"));
        }

        @Test @Order(11)
        @DisplayName("should return 403 when COOPERATIVE tries to deliver")
        void cooperativeCannotDeliver() throws Exception {
            mockMvc.perform(put("/api/batch/deliver/" + BATCH_ID)
                            .header("Authorization", cooperativeToken))
                    .andExpect(status().isForbidden());
        }
    }

    // ═════════════════════════════════════════════
    //  GET /api/batch/{id} — PUBLIC
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/batch/{id}")
    class GetBatchEndpoint {

        @Test @Order(12)
        @DisplayName("should return 200 with no token (public endpoint)")
        void publicCanGetBatch() throws Exception {
            BatchResponse withHistory = BatchResponse.builder()
                    .batchId(BATCH_ID).farmerName("Ram Bahadur").status("DELIVERED")
                    .transitHistory(List.of(
                            new BatchResponse.TransitCheckpoint("Nepalgunj", 1728000000L, "0xabc"),
                            new BatchResponse.TransitCheckpoint("Surkhet",   1728086400L, "0xdef")))
                    .build();
            when(batchService.getBatch(BATCH_ID)).thenReturn(withHistory);

            mockMvc.perform(get("/api/batch/" + BATCH_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.transitHistory.length()").value(2))
                    .andExpect(jsonPath("$.transitHistory[0].location").value("Nepalgunj"));
        }

        @Test @Order(13)
        @DisplayName("should return 400 for non-existent batch")
        void nonExistentBatchReturns400() throws Exception {
            when(batchService.getBatch("FAKE-999"))
                    .thenThrow(new RuntimeException("Batch not found: FAKE-999"));

            mockMvc.perform(get("/api/batch/FAKE-999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Batch not found: FAKE-999"));
        }
    }

    // ═════════════════════════════════════════════
    //  GET /api/batch/my/batches
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/batch/my/batches")
    class MyBatchesEndpoint {

        @Test @Order(14)
        @DisplayName("should return farmer's own batches")
        void farmerGetsOwnBatches() throws Exception {
            when(batchService.getBatchesByFarmer("ram@jumla.com"))
                    .thenReturn(List.of(mockResponse));

            mockMvc.perform(get("/api/batch/my/batches")
                            .header("Authorization", farmerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].batchId").value(BATCH_ID));
        }

        @Test @Order(15)
        @DisplayName("should return 403 without token")
        void noTokenReturns403() throws Exception {
            mockMvc.perform(get("/api/batch/my/batches"))
                    .andExpect(status().isForbidden());
        }
    }

    // ═════════════════════════════════════════════
    //  GET /api/batch/status/{status}
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/batch/status/{status}")
    class BatchesByStatusEndpoint {

        @Test @Order(16)
        @DisplayName("COOPERATIVE should see HARVESTED batches")
        void cooperativeSeesHarvestedBatches() throws Exception {
            when(batchService.getBatchesByStatus(BatchStatus.HARVESTED))
                    .thenReturn(List.of(mockResponse));

            mockMvc.perform(get("/api/batch/status/HARVESTED")
                            .header("Authorization", cooperativeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("HARVESTED"));
        }

        @Test @Order(17)
        @DisplayName("TRANSPORTER should see CERTIFIED batches")
        void transporterSeesCertifiedBatches() throws Exception {
            BatchResponse certified = BatchResponse.builder()
                    .batchId(BATCH_ID).status("CERTIFIED").build();
            when(batchService.getBatchesByStatus(BatchStatus.CERTIFIED))
                    .thenReturn(List.of(certified));

            mockMvc.perform(get("/api/batch/status/CERTIFIED")
                            .header("Authorization", transporterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("CERTIFIED"));
        }

        @Test @Order(18)
        @DisplayName("should return 400 for invalid status value")
        void invalidStatusReturns400() throws Exception {
            mockMvc.perform(get("/api/batch/status/INVALID_STATUS")
                            .header("Authorization", cooperativeToken))
                    .andExpect(status().isBadRequest());
        }
    }

    // ═════════════════════════════════════════════
    //  GET /api/batch/qr/{id} — PUBLIC
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/batch/qr/{id}")
    class QREndpoint {

        @Test @Order(19)
        @DisplayName("should return PNG image without auth")
        void publicCanGetQR() throws Exception {
            mockMvc.perform(get("/api/batch/qr/" + BATCH_ID))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private CreateBatchRequest validCreateRequest() {
        CreateBatchRequest req = new CreateBatchRequest();
        req.setFarmLocation("Jumla, Karnali Province");
        req.setAppleVariety("Fuji");
        req.setWeightKg(450L);
        req.setHarvestDate(LocalDateTime.now().minusDays(1)
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        req.setAiResult("FRESH");
        req.setIpfsHash("QmTest123");
        return req;
    }

    private TransitUpdateRequest transitRequest(String location, String destination) {
        TransitUpdateRequest req = new TransitUpdateRequest();
        req.setLocation(location);
        req.setDestination(destination);
        return req;
    }
}