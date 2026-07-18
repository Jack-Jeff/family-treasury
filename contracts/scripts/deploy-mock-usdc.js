// Deploys a test-only stablecoin (6 decimals, mint-on-demand) so you can try the
// treasury out on Monad testnet without hunting down a real USDC contract address.
// Swap to real USDC before handling real money — see README.
const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying MockUSDC on ${network.name} from ${deployer.address}`);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const address = await usdc.getAddress();
  console.log("MockUSDC deployed to:", address);
  console.log("\nUse this as USDC_ADDRESS in scripts/deploy.js / .env");

  // mint the deployer 10,000 test dollars to get started
  const tx = await usdc.mint(deployer.address, ethers.parseUnits("10000", 6));
  await tx.wait();
  console.log("Minted 10,000 test USDC to", deployer.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
