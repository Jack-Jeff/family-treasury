const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FamilyTreasuryFactory", function () {
  let factory, usdc;
  let alice, bob, carol;

  beforeEach(async function () {
    [alice, bob, carol] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    const Factory = await ethers.getContractFactory("FamilyTreasuryFactory");
    factory = await Factory.deploy();
  });

  it("deploys an independent treasury and indexes it by member", async function () {
    const tx = await factory
      .connect(alice)
      .createTreasury(await usdc.getAddress(), "The Smiths", [alice.address, bob.address], ["Alice", "Bob"], 2);
    const receipt = await tx.wait();

    const event = receipt.logs
      .map((l) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === "TreasuryCreated");

    expect(event).to.not.be.undefined;
    const treasuryAddr = event.args.treasury;
    expect(treasuryAddr).to.properAddress;

    const FamilyTreasury = await ethers.getContractFactory("FamilyTreasury");
    const treasury = FamilyTreasury.attach(treasuryAddr);
    expect(await treasury.treasuryName()).to.equal("The Smiths");
    expect(await treasury.threshold()).to.equal(2);

    const aliceTreasuries = await factory.getTreasuriesForMember(alice.address);
    expect(aliceTreasuries).to.deep.equal([treasuryAddr]);
  });

  it("keeps multiple treasuries fully independent of each other", async function () {
    await factory.connect(alice).createTreasury(await usdc.getAddress(), "Fam A", [alice.address, bob.address], ["A", "B"], 2);
    await factory.connect(carol).createTreasury(await usdc.getAddress(), "Fam B", [carol.address], ["C"], 1);

    expect(await factory.allTreasuriesCount()).to.equal(2);
    expect((await factory.getTreasuriesForMember(alice.address)).length).to.equal(1);
    expect((await factory.getTreasuriesForMember(carol.address)).length).to.equal(1);
    expect((await factory.getTreasuriesForMember(bob.address)).length).to.equal(1);
  });
});
