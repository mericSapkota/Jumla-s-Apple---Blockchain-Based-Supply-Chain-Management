package fyp.scm;

import fyp.scm.contract.AppleBatch;
import org.junit.jupiter.api.*;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.StaticGasProvider;

import java.math.BigInteger;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests against a REAL Ganache instance.
 *
 * Prerequisites:
 *   1. Ganache running on http://127.0.0.1:7545
 *   2. Paste your Ganache Account #0 private key (WITHOUT 0x) below
 *
 * Run with:
 *   mvn test -Dtest=GanacheIntegrationTest
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Ganache Blockchain Integration Tests")
class GanacheIntegrationTest {

    // ── Config ────────────────────────────────────────────────────────────────
    // Ganache Account #0 private key — NO 0x prefix
    private static final String GANACHE_PRIVATE_KEY =
            "0x92aabc58f92c3bfa8dc59f58c6cbfa256d0714ff4cfb3a24a8303a1b95817642";

    private static final String GANACHE_URL = "http://127.0.0.1:7545";

    // Gas config — Ganache default block limit is 6_721_975
    // We use 6_000_000 for deploy and 300_000 for calls — safely under the limit
    private static final BigInteger GAS_LIMIT = BigInteger.valueOf(6_000_000L);
    private static final BigInteger GAS_PRICE = BigInteger.valueOf(20_000_000_000L); // 20 Gwei

    private static Web3j web3j;
    private static Credentials credentials;
    private static AppleBatch contract;

    private static final String BATCH_ID      = "JML-TEST-0001";
    private static final String FARMER_NAME   = "Ram Bahadur";
    private static final String FARM_LOCATION = "Jumla, Karnali Province";
    private static final String APPLE_VARIETY = "Fuji";
    private static final long   WEIGHT_KG     = 450L;
    private static final String DESTINATION   = "Kathmandu";

    // ── Setup ─────────────────────────────────────────────────────────────────
    @BeforeAll
    static void connectToGanache() throws Exception {
        web3j       = Web3j.build(new HttpService(GANACHE_URL));
        credentials = Credentials.create(GANACHE_PRIVATE_KEY);

        // StaticGasProvider — explicit values, never hits block gas limit
        StaticGasProvider gasProvider = new StaticGasProvider(GAS_PRICE, GAS_LIMIT);

        System.out.println("🚀 Deploying AppleBatch to Ganache...");
        contract = AppleBatch.deploy(web3j, credentials, gasProvider).send();

        System.out.println("✅ Contract deployed at: " + contract.getContractAddress());
        assertThat(contract.getContractAddress()).isNotNull();
    }

    @AfterAll
    static void disconnect() {
        if (web3j != null) web3j.shutdown();
    }

    // ═════════════════════════════════════════════
    //  TEST 1 — Deployment
    // ═════════════════════════════════════════════
    @Test @Order(1)
    @DisplayName("1. Owner should have COOPERATIVE role by default")
    void contractDeployment() throws Exception {
        BigInteger ownerRole = contract.roles(credentials.getAddress()).send();
        assertThat(ownerRole).isEqualTo(BigInteger.valueOf(2)); // COOPERATIVE = 2
        System.out.println("✅ Owner role confirmed: COOPERATIVE");
    }

    // ═════════════════════════════════════════════
    //  TEST 2 — Assign FARMER role
    // ═════════════════════════════════════════════
    @Test @Order(2)
    @DisplayName("2. Owner should assign FARMER role")
    void assignFarmerRole() throws Exception {
        contract.assignRole(credentials.getAddress(), BigInteger.valueOf(1)).send();
        BigInteger role = contract.roles(credentials.getAddress()).send();
        assertThat(role).isEqualTo(BigInteger.valueOf(1));
        System.out.println("✅ FARMER role assigned");
    }

    // ═════════════════════════════════════════════
    //  TEST 3 — Create Batch
    // ═════════════════════════════════════════════
    @Test @Order(3)
    @DisplayName("3. Farmer should create a batch")
    void createBatch() throws Exception {
        long harvestTimestamp = System.currentTimeMillis() / 1000 - 3600;

        var receipt = contract.createBatch(
                BATCH_ID, FARMER_NAME, FARM_LOCATION, APPLE_VARIETY,
                BigInteger.valueOf(WEIGHT_KG),
                BigInteger.valueOf(harvestTimestamp),
                "QmTestHash123", "FRESH"
        ).send();

        assertThat(receipt.isStatusOK()).isTrue();
        assertThat(contract.batchIdExists(BATCH_ID).send()).isTrue();
        assertThat(contract.getBatchStatus(BATCH_ID).send()).isEqualTo("HARVESTED");

        System.out.println("✅ Batch created. TxHash: " + receipt.getTransactionHash());
    }

    // ═════════════════════════════════════════════
    //  TEST 4 — Certify Batch
    // ═════════════════════════════════════════════
    @Test @Order(4)
    @DisplayName("4. Cooperative should certify the batch")
    void certifyBatch() throws Exception {
        contract.assignRole(credentials.getAddress(), BigInteger.valueOf(2)).send();

        var receipt = contract.certifyBatch(BATCH_ID).send();
        assertThat(receipt.isStatusOK()).isTrue();
        assertThat(contract.getBatchStatus(BATCH_ID).send()).isEqualTo("CERTIFIED");

        System.out.println("✅ Batch certified. TxHash: " + receipt.getTransactionHash());
    }

    // ═════════════════════════════════════════════
    //  TEST 5 — First Transit Checkpoint
    // ═════════════════════════════════════════════
    @Test @Order(5)
    @DisplayName("5. Transporter should update transit (Nepalgunj)")
    void updateTransitFirst() throws Exception {
        contract.assignRole(credentials.getAddress(), BigInteger.valueOf(3)).send();

        var receipt = contract.updateTransit(BATCH_ID, "Nepalgunj", DESTINATION).send();
        assertThat(receipt.isStatusOK()).isTrue();
        assertThat(contract.getBatchStatus(BATCH_ID).send()).isEqualTo("IN_TRANSIT");

        System.out.println("✅ Transit: Nepalgunj. TxHash: " + receipt.getTransactionHash());
    }

    // ═════════════════════════════════════════════
    //  TEST 6 — Second Transit Checkpoint
    // ═════════════════════════════════════════════
    @Test @Order(6)
    @DisplayName("6. Transporter should add second checkpoint (Surkhet)")
    void updateTransitSecond() throws Exception {
        var receipt = contract.updateTransit(BATCH_ID, "Surkhet", DESTINATION).send();
        assertThat(receipt.isStatusOK()).isTrue();

        var history = contract.getTransitHistory(BATCH_ID).send();
        List<String> locations = history.component1();
        assertThat(locations).hasSize(2);
        assertThat(locations.get(0)).isEqualTo("Nepalgunj");
        assertThat(locations.get(1)).isEqualTo("Surkhet");

        System.out.println("✅ Transit history: " + locations);
    }

    // ═════════════════════════════════════════════
    //  TEST 7 — Deliver
    // ═════════════════════════════════════════════
    @Test @Order(7)
    @DisplayName("7. Transporter should deliver the batch")
    void deliverBatch() throws Exception {
        var receipt = contract.deliverBatch(BATCH_ID).send();
        assertThat(receipt.isStatusOK()).isTrue();
        assertThat(contract.getBatchStatus(BATCH_ID).send()).isEqualTo("DELIVERED");

        System.out.println("✅ Delivered! TxHash: " + receipt.getTransactionHash());
    }

    // ═════════════════════════════════════════════
    //  TEST 8 — Final Data Integrity
    // ═════════════════════════════════════════════
    @Test @Order(8)
    @DisplayName("8. getBatch() should return correct final state")
    void verifyFinalBatchData() throws Exception {
        var batch = contract.getBatch(BATCH_ID).send();

        assertThat(batch.component1()).isEqualTo(BATCH_ID);
        assertThat(batch.component2()).isEqualTo(FARMER_NAME);
        assertThat(batch.component3()).isEqualTo(FARM_LOCATION);
        assertThat(batch.component4()).isEqualTo(APPLE_VARIETY);
        assertThat(batch.component5()).isEqualTo(BigInteger.valueOf(WEIGHT_KG));
        assertThat(batch.component11()).isEqualTo("QmTestHash123");
        assertThat(batch.component12()).isEqualTo("FRESH");

        System.out.println("\n🍎 Final state verified: DELIVERED to " + DESTINATION);
    }

    // ═════════════════════════════════════════════
    //  TEST 9 — Update IPFS Hash
    // ═════════════════════════════════════════════
    @Test @Order(9)
    @DisplayName("9. Farmer should update IPFS hash")
    void updateIpfsHash() throws Exception {
        contract.assignRole(credentials.getAddress(), BigInteger.valueOf(1)).send();

        var receipt = contract.updateIPFSHash(BATCH_ID, "QmUpdatedHash456").send();
        assertThat(receipt.isStatusOK()).isTrue();

        var batch = contract.getBatch(BATCH_ID).send();
        assertThat(batch.component11()).isEqualTo("QmUpdatedHash456");

        System.out.println("✅ IPFS hash updated");
    }

    // ═════════════════════════════════════════════
    //  TEST 10 — getAllBatchIds
    // ═════════════════════════════════════════════
    @Test @Order(10)
    @DisplayName("10. getAllBatchIds() should include created batch")
    void getAllBatchIds() throws Exception {
        List<String> ids = contract.getAllBatchIds().send();
        assertThat(ids).contains(BATCH_ID);
        assertThat(contract.totalBatches().send()).isGreaterThanOrEqualTo(BigInteger.ONE);

        System.out.println("✅ Total batches on chain: " + contract.totalBatches().send());
    }
}