const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DynFlow to Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Error: Insufficient balance. Get Sepolia ETH from https://sepoliafaucet.com/");
    process.exit(1);
  }

  console.log("\n📦 Deploying contracts...");

  // Deploy DynFlowVault first
  const DynFlowVault = await hre.ethers.getContractFactory("DynFlowVault");
  const vault = await DynFlowVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ DynFlowVault deployed at:", vaultAddress);

  // Deploy DynFlowNFT
  const DynFlowNFT = await hre.ethers.getContractFactory("DynFlowNFT");
  const nft = await DynFlowNFT.deploy(vaultAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ DynFlowNFT deployed at:", nftAddress);

  // Verify vault
  console.log("\n🔍 Verifying DynFlowVault...");
  try {
    await hre.run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [],
    });
    console.log("✅ DynFlowVault verified on Etherscan");
  } catch (error) {
    if (error.message.includes("Already verified")) {
      console.log("ℹ️  DynFlowVault already verified");
    } else {
      console.log("⚠️  Verification failed (may need to wait):", error.message);
    }
  }

  // Verify NFT
  console.log("\n🔍 Verifying DynFlowNFT...");
  try {
    await hre.run("verify:verify", {
      address: nftAddress,
      constructorArguments: [vaultAddress],
    });
    console.log("✅ DynFlowNFT verified on Etherscan");
  } catch (error) {
    if (error.message.includes("Already verified")) {
      console.log("ℹ️  DynFlowNFT already verified");
    } else {
      console.log("⚠️  Verification failed (may need to wait):", error.message);
    }
  }

  console.log("\n📊 Deployment Summary:");
  console.log("Vault Address:", vaultAddress);
  console.log("NFT Address:", nftAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });