// Deploy FamilyTreasury.
//
// Usage:
//   1. Copy .env.example to .env and fill in DEPLOYER_PRIVATE_KEY
//   2. Edit the CONFIG block below with your family's details
//   3. npx hardhat run scripts/deploy.js --network giwaTestnet
//
const { ethers, network } = require("hardhat");

// ── CONFIG — edit before deploying ──────────────────────────────────────
const CONFIG = {
  treasuryName: "Fundo Test Treasury",
  usdcAddress: "0x06c8D5BB2C82d8282D8D01b334d5dA927782a146",
  members: [
    { address: "0x299CE62c149EdB65976e42d7a535E41719615065", name: "Bonaventure" },
  ],
  threshold: 1,
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
