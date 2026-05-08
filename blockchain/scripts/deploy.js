const { ethers } = require("hardhat");

/**
 * Deploy AppleBatch to Sepolia Testnet
 * Run: npx hardhat run scripts/deploy.js --network sepolia
 */
async function main() {
  console.log("\n Jumla Apple Supply Chain — Contract Deployment");
  console.log("═".repeat(52));

  // ── Get deployer wallet ──
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();

  console.log(`\n📋 Deployer address : ${deployer.address}`);
  console.log(`💰 Wallet balance   : ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.eq(0)) {
    console.error("\n Wallet has 0 ETH! Get Sepolia ETH from:");
    console.error("   https://sepoliafaucet.com");
    console.error("   https://faucet.quicknode.com/ethereum/sepolia");
    process.exit(1);
  }

  // ── Deploy contract ──
  console.log("\n⏳ Deploying AppleBatch contract...");
  const Factory = await ethers.getContractFactory("AppleBatch");
  const contract = await Factory.deploy();

  await contract.deployed();

  console.log("\n✅ Contract deployed successfully!");
  console.log(`📄 Contract address : ${contract.address}`);
  console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contract.address}`);

  // ── Save deployment info ──
  const fs = require("fs");
  const deploymentInfo = {
    network: "sepolia",
    contractName: "AppleBatch",
    contractAddress: contract.address,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: contract.deployTransaction.hash,
  };

  fs.writeFileSync("./deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");

  // ── Post-deploy: assign demo roles (optional for testing) ──
  // Uncomment and fill in your test wallet addresses:
  //
  // console.log("\n🔐 Assigning demo roles...");
  // const Role = { FARMER: 1, COOPERATIVE: 2, TRANSPORTER: 3, CONSUMER: 4 };
  // await contract.assignRole("0xFARMER_WALLET_ADDRESS",      Role.FARMER);
  // await contract.assignRole("0xCOOP_WALLET_ADDRESS",        Role.COOPERATIVE);
  // await contract.assignRole("0xTRANSPORTER_WALLET_ADDRESS", Role.TRANSPORTER);
  // console.log("✅ Roles assigned");

  console.log("\n📋 Next step — verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contract.address}`);
  console.log("\n🎉 Done!\n");
}

main().catch((error) => {
  console.error("\nDeployment failed:", error);
  process.exit(1);
});
