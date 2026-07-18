// Deploy FamilyTreasury to Monad.
//
// Usage:
//   1. Copy .env.example to .env and fill in DEPLOYER_PRIVATE_KEY
//   2. Edit the CONFIG block below with your family's details
//   3. npx hardhat run scripts/deploy.js --network monadTestnet
//
const { ethers, network } = require("hardhat");

// ── CONFIG — edit before deploying ──────────────────────────────────────
const CONFIG = {
  treasuryName: "The Smith Family Fund",
  usdcAddress: process.env.USDC_ADDRESS || "", // set per-network; see README for current testnet/mainnet USDC addresses
  members: [
    // { address: "0x...", name: "Mom" },
    // { address: "0x...", name: "Dad" },
    // { address: "0x...", name: "Kid" },
  ],
  threshold: 2, // e.g. 2-of-3
};
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  if (!CONFIG.usdcAddress) {
    throw new Error("Set usdcAddress in scripts/deploy.js (or USDC_ADDRESS env var) before deploying.");
  }
  if (CONFIG.members.length === 0) {
    throw new Error("Add at least one member in scripts/deploy.js CONFIG.members before deploying.");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying on ${network.name} from ${deployer.address}`);

  const FamilyTreasury = await ethers.getContractFactory("FamilyTreasury");
  const treasury = await FamilyTreasury.deploy(
    CONFIG.usdcAddress,
    CONFIG.treasuryName,
    CONFIG.members.map((m) => m.address),
    CONFIG.members.map((m) => m.name),
    CONFIG.threshold
  );
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log("FamilyTreasury deployed to:", address);
  console.log("Threshold:", CONFIG.threshold, "of", CONFIG.members.length);
  console.log("\nAdd this to frontend/.env:");
  console.log(`VITE_TREASURY_ADDRESS=${address}`);
  console.log(`VITE_USDC_ADDRESS=${CONFIG.usdcAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
