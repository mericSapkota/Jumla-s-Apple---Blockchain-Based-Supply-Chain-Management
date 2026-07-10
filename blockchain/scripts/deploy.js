const { ethers } = require("hardhat");

/**
 * Deploy AppleBatch to Sepolia Testnet
 * Run: npx hardhat run scripts/deploy.js --network sepolia
 */
async function main() {
  console.log("\n🍎 Jumla Apple Supply Chain — Contract Deployment");
  console.log("═".repeat(52));

  // ── Get deployer wallet ──
  const [deployer] = await ethers.getSigners();

  // ethers v6 — balance comes from provider, NOT signer
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Deployer address : ${deployer.address}`);
  console.log(`💰 Wallet balance   : ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("\n❌ Wallet has 0 ETH! Get Sepolia ETH from:");
    console.error("   https://sepoliafaucet.com");
    console.error("   https://faucet.quicknode.com/ethereum/sepolia");
    process.exit(1);
  }

  // ── Deploy contract ──
  console.log("\n⏳ Deploying AppleBatch contract...");
  const Factory = await ethers.getContractFactory("AppleBatch");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log(`📄 Contract address : ${contractAddress}`);
  console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

  // ── Save deployment info ──
  const fs = require("fs");
  const deploymentInfo = {
    network: "sepolia",
    contractName: "AppleBatch",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction().hash,
  };

  fs.writeFileSync("./deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");

  console.log("\n📋 Next step — verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("\n🎉 Done!\n");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exit(1);
});
