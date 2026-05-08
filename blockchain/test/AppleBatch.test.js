const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────
//  Helper: current Unix timestamp (seconds)
// ─────────────────────────────────────────────────────────────
const now = () => Math.floor(Date.now() / 1000);

// Role enum values (must match contract)
const Role = { NONE: 0, FARMER: 1, COOPERATIVE: 2, TRANSPORTER: 3, CONSUMER: 4 };
const Status = { HARVESTED: 0, CERTIFIED: 1, IN_TRANSIT: 2, DELIVERED: 3 };

describe("AppleBatch Contract", function () {
  let contract;
  let owner, farmer, cooperative, transporter, consumer, stranger;

  // Sample batch data
  const BATCH_ID = "JML-2025-0042";
  const FARMER_NAME = "Ram Bahadur";
  const FARM_LOCATION = "Jumla, Karnali Province";
  const APPLE_VARIETY = "Fuji";
  const WEIGHT_KG = 450;
  const HARVEST_DATE = now() - 3600; // 1 hour ago (must not be future)
  const IPFS_HASH = "QmXyz123abc";
  const AI_RESULT = "FRESH";
  const DESTINATION = "Kathmandu";

  // ─── Deploy fresh contract before each test ───
  beforeEach(async function () {
    [owner, farmer, cooperative, transporter, consumer, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AppleBatch");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // Assign roles via owner
    await contract.connect(owner).assignRole(farmer.address, Role.FARMER);
    await contract.connect(owner).assignRole(cooperative.address, Role.COOPERATIVE);
    await contract.connect(owner).assignRole(transporter.address, Role.TRANSPORTER);
    await contract.connect(owner).assignRole(consumer.address, Role.CONSUMER);
  });

  // ═════════════════════════════════════════════
  //  1. DEPLOYMENT
  // ═════════════════════════════════════════════
  describe("1. Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should assign COOPERATIVE role to owner by default", async function () {
      expect(await contract.connect(owner).myRole()).to.equal(Role.COOPERATIVE);
    });

    it("should start with zero batches", async function () {
      expect(await contract.totalBatches()).to.equal(0);
    });
  });

  // ═════════════════════════════════════════════
  //  2. ROLE MANAGEMENT
  // ═════════════════════════════════════════════
  describe("2. Role Management", function () {
    it("should correctly assign FARMER role", async function () {
      expect(await contract.roles(farmer.address)).to.equal(Role.FARMER);
    });

    it("should correctly assign COOPERATIVE role", async function () {
      expect(await contract.roles(cooperative.address)).to.equal(Role.COOPERATIVE);
    });

    it("should correctly assign TRANSPORTER role", async function () {
      expect(await contract.roles(transporter.address)).to.equal(Role.TRANSPORTER);
    });

    it("should revert if non-owner tries to assign a role", async function () {
      await expect(contract.connect(stranger).assignRole(stranger.address, Role.FARMER)).to.be.revertedWith(
        "Only owner",
      );
    });

    it("should revert assigning role to zero address", async function () {
      await expect(contract.connect(owner).assignRole(ethers.ZeroAddress, Role.FARMER)).to.be.revertedWith(
        "Zero address",
      );
    });

    it("myRole() should return correct role for caller", async function () {
      expect(await contract.connect(farmer).myRole()).to.equal(Role.FARMER);
    });
  });

  // ═════════════════════════════════════════════
  //  3. CREATE BATCH (Farmer)
  // ═════════════════════════════════════════════
  describe("3. createBatch()", function () {
    it("should allow a farmer to create a batch", async function () {
      await expect(
        contract
          .connect(farmer)
          .createBatch(
            BATCH_ID,
            FARMER_NAME,
            FARM_LOCATION,
            APPLE_VARIETY,
            WEIGHT_KG,
            HARVEST_DATE,
            IPFS_HASH,
            AI_RESULT,
          ),
      )
        .to.emit(contract, "BatchCreated")
        .withArgs(BATCH_ID, farmer.address, FARMER_NAME);
    });

    it("should store batch data correctly on-chain", async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );

      const batch = await contract.getBatch(BATCH_ID);
      expect(batch[0]).to.equal(BATCH_ID); // batchId
      expect(batch[1]).to.equal(FARMER_NAME); // farmerName
      expect(batch[2]).to.equal(FARM_LOCATION); // farmLocation
      expect(batch[3]).to.equal(APPLE_VARIETY); // appleVariety
      expect(batch[4]).to.equal(WEIGHT_KG); // weightKg
      expect(batch[6]).to.equal(Status.HARVESTED); // status
      expect(batch[10]).to.equal(IPFS_HASH); // ipfsHash
      expect(batch[11]).to.equal(AI_RESULT); // aiResult
    });

    it("should increment totalBatches", async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      expect(await contract.totalBatches()).to.equal(1);
    });

    it("should add batchId to getAllBatchIds()", async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      const ids = await contract.getAllBatchIds();
      expect(ids).to.include(BATCH_ID);
    });

    it("should revert on duplicate batch ID", async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      await expect(
        contract
          .connect(farmer)
          .createBatch(
            BATCH_ID,
            FARMER_NAME,
            FARM_LOCATION,
            APPLE_VARIETY,
            WEIGHT_KG,
            HARVEST_DATE,
            IPFS_HASH,
            AI_RESULT,
          ),
      ).to.be.revertedWith("Batch ID already exists");
    });

    it("should revert if weight is 0", async function () {
      await expect(
        contract
          .connect(farmer)
          .createBatch(BATCH_ID, FARMER_NAME, FARM_LOCATION, APPLE_VARIETY, 0, HARVEST_DATE, IPFS_HASH, AI_RESULT),
      ).to.be.revertedWith("Weight must be > 0");
    });

    it("should revert if harvest date is in the future", async function () {
      const futureDate = now() + 86400; // tomorrow
      await expect(
        contract
          .connect(farmer)
          .createBatch(
            BATCH_ID,
            FARMER_NAME,
            FARM_LOCATION,
            APPLE_VARIETY,
            WEIGHT_KG,
            futureDate,
            IPFS_HASH,
            AI_RESULT,
          ),
      ).to.be.revertedWith("Harvest date cannot be future");
    });

    it("should revert if caller is not a FARMER", async function () {
      await expect(
        contract
          .connect(stranger)
          .createBatch(
            BATCH_ID,
            FARMER_NAME,
            FARM_LOCATION,
            APPLE_VARIETY,
            WEIGHT_KG,
            HARVEST_DATE,
            IPFS_HASH,
            AI_RESULT,
          ),
      ).to.be.revertedWith("Wrong role");
    });

    it("should revert if cooperative tries to create batch", async function () {
      await expect(
        contract
          .connect(cooperative)
          .createBatch(
            BATCH_ID,
            FARMER_NAME,
            FARM_LOCATION,
            APPLE_VARIETY,
            WEIGHT_KG,
            HARVEST_DATE,
            IPFS_HASH,
            AI_RESULT,
          ),
      ).to.be.revertedWith("Wrong role");
    });
  });

  // ═════════════════════════════════════════════
  //  4. CERTIFY BATCH (Cooperative)
  // ═════════════════════════════════════════════
  describe("4. certifyBatch()", function () {
    beforeEach(async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
    });

    it("should allow cooperative to certify a HARVESTED batch", async function () {
      await expect(contract.connect(cooperative).certifyBatch(BATCH_ID)).to.emit(contract, "BatchCertified");
    });

    it("should update status to CERTIFIED", async function () {
      await contract.connect(cooperative).certifyBatch(BATCH_ID);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("CERTIFIED");
    });

    it("should revert if batch is already CERTIFIED", async function () {
      await contract.connect(cooperative).certifyBatch(BATCH_ID);
      await expect(contract.connect(cooperative).certifyBatch(BATCH_ID)).to.be.revertedWith("Invalid status");
    });

    it("should revert if caller is not a COOPERATIVE", async function () {
      await expect(contract.connect(farmer).certifyBatch(BATCH_ID)).to.be.revertedWith("Wrong role");
    });

    it("should revert on non-existent batch", async function () {
      await expect(contract.connect(cooperative).certifyBatch("FAKE-999")).to.be.revertedWith("Batch not found");
    });
  });

  // ═════════════════════════════════════════════
  //  5. UPDATE TRANSIT (Transporter)
  // ═════════════════════════════════════════════
  describe("5. updateTransit()", function () {
    beforeEach(async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      await contract.connect(cooperative).certifyBatch(BATCH_ID);
    });

    it("should move status to IN_TRANSIT on first update", async function () {
      await contract.connect(transporter).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("IN_TRANSIT");
    });

    it("should emit TransitUpdated event", async function () {
      await expect(contract.connect(transporter).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION)).to.emit(
        contract,
        "TransitUpdated",
      );
    });

    it("should store multiple transit checkpoints", async function () {
      await contract.connect(transporter).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION);
      await contract.connect(transporter).updateTransit(BATCH_ID, "Surkhet", DESTINATION);
      await contract.connect(transporter).updateTransit(BATCH_ID, "Kathmandu", DESTINATION);

      const history = await contract.getTransitHistory(BATCH_ID);
      expect(history.locations.length).to.equal(3);
      expect(history.locations[0]).to.equal("Nepalgunj");
      expect(history.locations[1]).to.equal("Surkhet");
      expect(history.locations[2]).to.equal("Kathmandu");
    });

    it("should revert if batch is still HARVESTED (not yet certified)", async function () {
      const BATCH_ID_2 = "JML-2025-0099";
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID_2,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      await expect(
        contract.connect(transporter).updateTransit(BATCH_ID_2, "Nepalgunj", DESTINATION),
      ).to.be.revertedWith("Must be CERTIFIED or IN_TRANSIT");
    });

    it("should revert if caller is not a TRANSPORTER", async function () {
      await expect(contract.connect(farmer).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION)).to.be.revertedWith(
        "Wrong role",
      );
    });
  });

  // ═════════════════════════════════════════════
  //  6. DELIVER BATCH (Transporter)
  // ═════════════════════════════════════════════
  describe("6. deliverBatch()", function () {
    beforeEach(async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      await contract.connect(cooperative).certifyBatch(BATCH_ID);
      await contract.connect(transporter).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION);
    });

    it("should mark batch as DELIVERED", async function () {
      await contract.connect(transporter).deliverBatch(BATCH_ID);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("DELIVERED");
    });

    it("should emit BatchDelivered event", async function () {
      await expect(contract.connect(transporter).deliverBatch(BATCH_ID)).to.emit(contract, "BatchDelivered");
    });

    it("should revert if already DELIVERED", async function () {
      await contract.connect(transporter).deliverBatch(BATCH_ID);
      await expect(contract.connect(transporter).deliverBatch(BATCH_ID)).to.be.revertedWith("Invalid status");
    });

    it("should revert if batch not IN_TRANSIT yet", async function () {
      const BATCH_ID_2 = "JML-2025-0100";
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID_2,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      await contract.connect(cooperative).certifyBatch(BATCH_ID_2);
      await expect(contract.connect(transporter).deliverBatch(BATCH_ID_2)).to.be.revertedWith("Invalid status");
    });
  });

  // ═════════════════════════════════════════════
  //  7. IPFS HASH UPDATE
  // ═════════════════════════════════════════════
  describe("7. updateIPFSHash()", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch(
        BATCH_ID,
        FARMER_NAME,
        FARM_LOCATION,
        APPLE_VARIETY,
        WEIGHT_KG,
        HARVEST_DATE,
        "",
        AI_RESULT, // empty IPFS hash initially
      );
    });

    it("should allow farmer to update IPFS hash", async function () {
      await expect(contract.connect(farmer).updateIPFSHash(BATCH_ID, IPFS_HASH))
        .to.emit(contract, "IPFSHashUpdated")
        .withArgs(BATCH_ID, IPFS_HASH);

      const batch = await contract.getBatch(BATCH_ID);
      expect(batch[10]).to.equal(IPFS_HASH);
    });

    it("should allow owner to update IPFS hash", async function () {
      await contract.connect(owner).updateIPFSHash(BATCH_ID, "QmNewHash456");
      const batch = await contract.getBatch(BATCH_ID);
      expect(batch[10]).to.equal("QmNewHash456");
    });

    it("should revert if stranger tries to update IPFS hash", async function () {
      await expect(contract.connect(stranger).updateIPFSHash(BATCH_ID, IPFS_HASH)).to.be.revertedWith("Not authorized");
    });
  });

  // ═════════════════════════════════════════════
  //  8. READ FUNCTIONS
  // ═════════════════════════════════════════════
  describe("8. Read Functions", function () {
    beforeEach(async function () {
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
    });

    it("getBatchStatus() returns HARVESTED after creation", async function () {
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("HARVESTED");
    });

    it("batchIdExists() returns true for created batch", async function () {
      expect(await contract.batchIdExists(BATCH_ID)).to.equal(true);
    });

    it("batchIdExists() returns false for unknown batch", async function () {
      expect(await contract.batchIdExists("FAKE-000")).to.equal(false);
    });

    it("getAllBatchIds() lists all created batches", async function () {
      const BATCH_ID_2 = "JML-2025-0043";
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID_2,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      const ids = await contract.getAllBatchIds();
      expect(ids.length).to.equal(2);
      expect(ids).to.include(BATCH_ID);
      expect(ids).to.include(BATCH_ID_2);
    });

    it("getBatch() reverts for non-existent batch", async function () {
      await expect(contract.getBatch("NOPE-999")).to.be.revertedWith("Batch not found");
    });

    it("getTransitHistory() returns empty array before transit", async function () {
      const history = await contract.getTransitHistory(BATCH_ID);
      expect(history.locations.length).to.equal(0);
    });
  });

  // ═════════════════════════════════════════════
  //  9. FULL LIFECYCLE — End-to-End
  // ═════════════════════════════════════════════
  describe("9. Full Lifecycle (End-to-End)", function () {
    it("should complete HARVESTED → CERTIFIED → IN_TRANSIT → DELIVERED", async function () {
      // Step 1: Farmer creates batch
      await contract
        .connect(farmer)
        .createBatch(
          BATCH_ID,
          FARMER_NAME,
          FARM_LOCATION,
          APPLE_VARIETY,
          WEIGHT_KG,
          HARVEST_DATE,
          IPFS_HASH,
          AI_RESULT,
        );
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("HARVESTED");

      // Step 2: Farmer uploads IPFS hash after photo upload
      await contract.connect(farmer).updateIPFSHash(BATCH_ID, "QmFinalHash789");

      // Step 3: Cooperative certifies
      await contract.connect(cooperative).certifyBatch(BATCH_ID);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("CERTIFIED");

      // Step 4: Transporter logs checkpoints
      await contract.connect(transporter).updateTransit(BATCH_ID, "Jumla Depot", DESTINATION);
      await contract.connect(transporter).updateTransit(BATCH_ID, "Nepalgunj", DESTINATION);
      await contract.connect(transporter).updateTransit(BATCH_ID, "Surkhet", DESTINATION);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("IN_TRANSIT");

      // Step 5: Transporter delivers
      await contract.connect(transporter).deliverBatch(BATCH_ID);
      expect(await contract.getBatchStatus(BATCH_ID)).to.equal("DELIVERED");

      // Verify final transit history
      const history = await contract.getTransitHistory(BATCH_ID);
      expect(history.locations.length).to.equal(3);

      // Verify final batch state
      const batch = await contract.getBatch(BATCH_ID);
      expect(batch[6]).to.equal(Status.DELIVERED); // status
      expect(batch[8]).to.equal(DESTINATION); // destination
      expect(batch[10]).to.equal("QmFinalHash789"); // updated IPFS hash

      console.log("\n  ✅ Full lifecycle passed:");
      console.log(`     Batch: ${batch[0]}`);
      console.log(`     Farmer: ${batch[1]} @ ${batch[2]}`);
      console.log(`     Variety: ${batch[3]}, ${batch[4]}kg`);
      console.log(`     Status: DELIVERED to ${batch[8]}`);
      console.log(`     Transit hops: ${history.locations.join(" → ")}`);
    });
  });
});

// ─── Utility ─────────────────────────────────
async function getBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
