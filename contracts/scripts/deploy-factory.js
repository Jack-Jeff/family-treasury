// Deploy the FamilyTreasuryFactory once. After this, anyone can create their own
// treasury through the frontend — no more manual per-family deploy scripts needed.
const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying FamilyTreasuryFactory on ${network.name} from ${deployer.address}`);

  const Factory = await ethers.getContractFactory("FamilyTreasuryFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("FamilyTreasuryFactory deployed to:", address);
  console.log("\nAdd this to frontend/.env:");
  console.log(`VITE_FACTORY_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
