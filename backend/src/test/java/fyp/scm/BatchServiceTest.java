package fyp.scm;



import fyp.scm.batch.*;
import fyp.scm.contract.AppleBatch;
import fyp.scm.user.Role;
import fyp.scm.user.User;
import fyp.scm.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tuples.generated.Tuple3;
import org.web3j.tx.gas.ContractGasProvider;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BatchService Unit Tests")
class BatchServiceTest {

    // ── Mocks ────────────────────────────────────────────────────────────────
    @Mock private Web3j web3j;
    @Mock private Credentials credentials;
    @Mock private ContractGasProvider gasProvider;
    @Mock private BatchRepository batchRepository;
    @Mock private UserRepository userRepository;
    @Mock private AppleBatch mockContract;

    @InjectMocks
    private BatchService batchService;

    // ── Test Data ────────────────────────────────────────────────────────────
    private static final String FARMER_EMAIL   = "ram@jumla.com";
    private static final String BATCH_ID       = "JML-2025-AB12";
    private static final String TX_HASH        = "0xabc123def456";

    private User mockFarmer;
    private BatchEntity mockBatchEntity;
    private TransactionReceipt mockReceipt;

    @BeforeEach
    void setUp() {
        mockFarmer = User.builder()
                .id(1L)
                .email(FARMER_EMAIL)
                .fullName("Ram Bahadur")
                .role(Role.FARMER)
                .password("encoded_password")
                .build();

        mockBatchEntity = BatchEntity.builder()
                .batchId(BATCH_ID)
                .farmerEmail(FARMER_EMAIL)
                .farmerName("Ram Bahadur")
                .farmLocation("Jumla, Karnali Province")
                .appleVariety("Fuji")
                .weightKg(450L)
                .harvestDate(LocalDateTime.now().minusDays(1))
                .status(BatchStatus.HARVESTED)
                .aiResult("FRESH")
                .ipfsHash("QmTest123")
                .txHashCreate(TX_HASH)
                .build();

        mockReceipt = new TransactionReceipt();
        mockReceipt.setTransactionHash(TX_HASH);
    }

    // ═════════════════════════════════════════════
    //  1. CREATE BATCH
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("1. createBatch()")
    class CreateBatchTests {

        @Test
        @DisplayName("should create batch in DB and return response")
        void shouldCreateBatch() throws Exception {
            // Arrange
            CreateBatchRequest req = new CreateBatchRequest();
            req.setFarmLocation("Jumla, Karnali Province");
            req.setAppleVariety("Fuji");
            req.setWeightKg(450L);
            req.setHarvestDate(LocalDateTime.now().minusDays(1)
                    .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            req.setAiResult("FRESH");
            req.setIpfsHash("QmTest123");

            when(userRepository.findByEmail(FARMER_EMAIL))
                    .thenReturn(Optional.of(mockFarmer));
            when(batchRepository.existsByBatchId(anyString())).thenReturn(false);

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.createBatch(anyString(), anyString(), anyString(),
                        anyString(), any(), any(), anyString(), anyString()))
                        .thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                // Act
                BatchResponse response = batchService.createBatch(req, FARMER_EMAIL);

                // Assert
                assertThat(response).isNotNull();
                assertThat(response.getFarmerName()).isEqualTo("Ram Bahadur");
                assertThat(response.getStatus()).isEqualTo("HARVESTED");
                assertThat(response.getAiResult()).isEqualTo("FRESH");
                verify(batchRepository, times(1)).save(any(BatchEntity.class));
            }
        }

        @Test
        @DisplayName("should throw when farmer not found")
        void shouldThrowWhenFarmerNotFound() {
            CreateBatchRequest req = new CreateBatchRequest();
            req.setFarmLocation("Jumla");
            req.setAppleVariety("Fuji");
            req.setWeightKg(100L);
            req.setHarvestDate(LocalDateTime.now().minusDays(1)
                    .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            when(userRepository.findByEmail(FARMER_EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> batchService.createBatch(req, FARMER_EMAIL))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Farmer not found");
        }
    }

    // ═════════════════════════════════════════════
    //  2. CERTIFY BATCH
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("2. certifyBatch()")
    class CertifyBatchTests {

        @Test
        @DisplayName("should certify HARVESTED batch and update status")
        void shouldCertifyBatch() throws Exception {
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.certifyBatch(BATCH_ID)).thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                BatchResponse response = batchService.certifyBatch(BATCH_ID);

                assertThat(response).isNotNull();
                verify(batchRepository).save(argThat(entity ->
                        entity.getStatus() == BatchStatus.CERTIFIED &&
                                entity.getTxHashCertify().equals(TX_HASH)));
            }
        }

        @Test
        @DisplayName("should throw if batch is not HARVESTED")
        void shouldThrowIfNotHarvested() {
            mockBatchEntity.setStatus(BatchStatus.CERTIFIED); // already certified

            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            assertThatThrownBy(() -> batchService.certifyBatch(BATCH_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("HARVESTED");
        }

        @Test
        @DisplayName("should throw if batch not found")
        void shouldThrowIfBatchNotFound() {
            when(batchRepository.findByBatchId(BATCH_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> batchService.certifyBatch(BATCH_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Batch not found");
        }
    }

    // ═════════════════════════════════════════════
    //  3. UPDATE TRANSIT
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("3. updateTransit()")
    class UpdateTransitTests {

        @Test
        @DisplayName("should move CERTIFIED batch to IN_TRANSIT on first call")
        void shouldMoveToInTransit() throws Exception {
            mockBatchEntity.setStatus(BatchStatus.CERTIFIED);

            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            TransitUpdateRequest req = new TransitUpdateRequest();
            req.setLocation("Nepalgunj");
            req.setDestination("Kathmandu");

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.updateTransit(anyString(), anyString(), anyString()))
                        .thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                batchService.updateTransit(BATCH_ID, req);

                verify(batchRepository).save(argThat(entity ->
                        entity.getStatus() == BatchStatus.IN_TRANSIT &&
                                entity.getDestination().equals("Kathmandu")));
            }
        }

        @Test
        @DisplayName("should allow additional checkpoints when already IN_TRANSIT")
        void shouldAllowAdditionalCheckpoints() throws Exception {
            mockBatchEntity.setStatus(BatchStatus.IN_TRANSIT);
            mockBatchEntity.setDestination("Kathmandu");

            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            TransitUpdateRequest req = new TransitUpdateRequest();
            req.setLocation("Surkhet");

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.updateTransit(anyString(), anyString(), anyString()))
                        .thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                BatchResponse response = batchService.updateTransit(BATCH_ID, req);

                // Status should stay IN_TRANSIT (not re-promoted)
                assertThat(mockBatchEntity.getStatus()).isEqualTo(BatchStatus.IN_TRANSIT);
                verify(batchRepository).save(any());
            }
        }

        @Test
        @DisplayName("should throw if batch is still HARVESTED")
        void shouldThrowIfHarvested() {
            mockBatchEntity.setStatus(BatchStatus.HARVESTED);
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            TransitUpdateRequest req = new TransitUpdateRequest();
            req.setLocation("Nepalgunj");

            assertThatThrownBy(() -> batchService.updateTransit(BATCH_ID, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("CERTIFIED or IN_TRANSIT");
        }
    }

    // ═════════════════════════════════════════════
    //  4. DELIVER BATCH
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("4. deliverBatch()")
    class DeliverBatchTests {

        @Test
        @DisplayName("should mark IN_TRANSIT batch as DELIVERED")
        void shouldDeliverBatch() throws Exception {
            mockBatchEntity.setStatus(BatchStatus.IN_TRANSIT);

            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.deliverBatch(BATCH_ID)).thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                batchService.deliverBatch(BATCH_ID);

                verify(batchRepository).save(argThat(entity ->
                        entity.getStatus() == BatchStatus.DELIVERED &&
                                entity.getTxHashDeliver().equals(TX_HASH)));
            }
        }

        @Test
        @DisplayName("should throw if batch is not IN_TRANSIT")
        void shouldThrowIfNotInTransit() {
            mockBatchEntity.setStatus(BatchStatus.CERTIFIED);
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            assertThatThrownBy(() -> batchService.deliverBatch(BATCH_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("IN_TRANSIT");
        }
    }

    // ═════════════════════════════════════════════
    //  5. UPDATE IPFS HASH
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("5. updateIpfsHash()")
    class UpdateIpfsHashTests {

        @Test
        @DisplayName("should update IPFS hash and AI result")
        void shouldUpdateIpfsHash() throws Exception {
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            IpfsUpdateRequest req = new IpfsUpdateRequest();
            req.setIpfsHash("QmNewHash789");
            req.setAiResult("DAMAGED");

            RemoteFunctionCall<TransactionReceipt> mockCall = mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockReceipt);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.updateIPFSHash(anyString(), anyString()))
                        .thenReturn(mockCall);
                when(batchRepository.save(any())).thenReturn(mockBatchEntity);

                batchService.updateIpfsHash(BATCH_ID, req, FARMER_EMAIL);

                verify(batchRepository).save(argThat(entity ->
                        entity.getIpfsHash().equals("QmNewHash789") &&
                                entity.getAiResult().equals("DAMAGED")));
            }
        }

        @Test
        @DisplayName("should throw if wrong farmer tries to update")
        void shouldThrowIfWrongFarmer() {
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            IpfsUpdateRequest req = new IpfsUpdateRequest();
            req.setIpfsHash("QmNewHash");

            assertThatThrownBy(() ->
                    batchService.updateIpfsHash(BATCH_ID, req, "hacker@evil.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Only the batch owner");
        }
    }

    // ═════════════════════════════════════════════
    //  6. READ OPERATIONS
    // ═════════════════════════════════════════════
    @Nested
    @DisplayName("6. Read Operations")
    class ReadTests {

        @Test
        @DisplayName("getBatch() should return batch with transit history")
        void shouldGetBatchWithHistory() throws Exception {
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            // Mock transit history from blockchain
            Tuple3<List<String>, List<BigInteger>, List<String>> mockHistory =
                    new Tuple3<>(
                            List.of("Nepalgunj", "Surkhet"),
                            List.of(BigInteger.valueOf(1728000000L), BigInteger.valueOf(1728086400L)),
                            List.of("0xabc", "0xdef")
                    );

            RemoteFunctionCall<Tuple3<List<String>, List<BigInteger>, List<String>>> mockCall =
                    mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenReturn(mockHistory);

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.getTransitHistory(BATCH_ID)).thenReturn(mockCall);

                BatchResponse response = batchService.getBatch(BATCH_ID);

                assertThat(response).isNotNull();
                assertThat(response.getBatchId()).isEqualTo(BATCH_ID);
                assertThat(response.getTransitHistory()).hasSize(2);
                assertThat(response.getTransitHistory().get(0).getLocation())
                        .isEqualTo("Nepalgunj");
            }
        }

        @Test
        @DisplayName("getBatch() should still return batch even if blockchain is unreachable")
        void shouldReturnBatchWhenChainUnreachable() throws Exception {
            when(batchRepository.findByBatchId(BATCH_ID))
                    .thenReturn(Optional.of(mockBatchEntity));

            RemoteFunctionCall<Tuple3<List<String>, List<BigInteger>, List<String>>> mockCall =
                    mock(RemoteFunctionCall.class);
            when(mockCall.send()).thenThrow(new RuntimeException("Chain unreachable"));

            try (MockedStatic<AppleBatch> mocked = mockStatic(AppleBatch.class)) {
                mocked.when(() -> AppleBatch.load((String) any(), (Web3j) any(), (Credentials) any(), any()))
                        .thenReturn(mockContract);
                when(mockContract.getTransitHistory(BATCH_ID)).thenReturn(mockCall);

                // Should NOT throw — graceful fallback to empty history
                BatchResponse response = batchService.getBatch(BATCH_ID);

                assertThat(response).isNotNull();
                assertThat(response.getTransitHistory()).isEmpty();
            }
        }

        @Test
        @DisplayName("getBatchesByFarmer() should return all farmer batches")
        void shouldGetBatchesByFarmer() {
            List<BatchEntity> entities = List.of(mockBatchEntity);
            when(batchRepository.findByFarmerEmail(FARMER_EMAIL)).thenReturn(entities);

            List<BatchResponse> responses = batchService.getBatchesByFarmer(FARMER_EMAIL);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getFarmerEmail()).isEqualTo(FARMER_EMAIL);
        }

        @Test
        @DisplayName("getBatchesByStatus() should filter correctly")
        void shouldGetBatchesByStatus() {
            when(batchRepository.findByStatus(BatchStatus.HARVESTED))
                    .thenReturn(List.of(mockBatchEntity));

            List<BatchResponse> responses =
                    batchService.getBatchesByStatus(BatchStatus.HARVESTED);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getStatus()).isEqualTo("HARVESTED");
        }
    }
}