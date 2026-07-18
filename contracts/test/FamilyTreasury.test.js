const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FamilyTreasury", function () {
  let usdc, treasury;
  let mom, dad, kid1, kid2, outsider;
  const THRESHOLD = 3;

  beforeEach(async function () {
    [mom, dad, kid1, kid2, outsider] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const FamilyTreasury = await ethers.getContractFactory("FamilyTreasury");
    treasury = await FamilyTreasury.deploy(
      await usdc.getAddress(),
      "The Smith Family Fund",
      [mom.address, dad.address, kid1.address, kid2.address],
      ["Mom", "Dad", "Kid1", "Kid2"],
      THRESHOLD
    );

    // fund everyone with mock USDC and approve the treasury
    for (const signer of [mom, dad, kid1, kid2]) {
      await usdc.mint(signer.address, ethers.parseUnits("1000", 6));
      await usdc.connect(signer).approve(await treasury.getAddress(), ethers.MaxUint256);
    }
  });

  it("sets up initial members and threshold", async function () {
    expect(await treasury.threshold()).to.equal(THRESHOLD);
    expect(await treasury.activeMemberCount()).to.equal(4);
    const m = await treasury.members(mom.address);
    expect(m.name).to.equal("Mom");
    expect(m.active).to.equal(true);
  });

  it("accepts contributions and tracks totals transparently", async function () {
    await expect(treasury.connect(mom).contribute(ethers.parseUnits("100", 6)))
      .to.emit(treasury, "Contributed");

    await treasury.connect(dad).contribute(ethers.parseUnits("50", 6));

    expect((await treasury.members(mom.address)).totalContributed).to.equal(ethers.parseUnits("100", 6));
    expect(await treasury.treasuryBalance()).to.equal(ethers.parseUnits("150", 6));
    expect(await treasury.contributionCount()).to.equal(2);
  });

  it("rejects contributions from non-members", async function () {
    await usdc.mint(outsider.address, ethers.parseUnits("100", 6));
    await usdc.connect(outsider).approve(await treasury.getAddress(), ethers.MaxUint256);
    await expect(treasury.connect(outsider).contribute(100)).to.be.revertedWithCustomError(treasury, "NotMember");
  });

  it("requires threshold approvals before a withdrawal executes", async function () {
    await treasury.connect(mom).contribute(ethers.parseUnits("500", 6));

    // proposer auto-approves (1/3); pay out to a non-member so we can check balance from zero
    const tx = await treasury.connect(dad).proposeWithdrawal(outsider.address, ethers.parseUnits("200", 6), "New bike");
    await tx.wait();
    const id = 0n;

    let proposal = await treasury.getProposal(id);
    expect(proposal.approvalCount).to.equal(1);
    expect(proposal.executed).to.equal(false);

    // second approval (2/3) - not enough yet
    await treasury.connect(mom).approveProposal(id);
    proposal = await treasury.getProposal(id);
    expect(proposal.executed).to.equal(false);
    expect(await usdc.balanceOf(outsider.address)).to.equal(0);

    // third approval (3/3) - executes automatically
    await expect(treasury.connect(kid1).approveProposal(id)).to.emit(treasury, "ProposalExecuted");

    proposal = await treasury.getProposal(id);
    expect(proposal.executed).to.equal(true);
    expect(await usdc.balanceOf(outsider.address)).to.equal(ethers.parseUnits("200", 6));
  });

  it("prevents double approval and approving executed proposals", async function () {
    await treasury.connect(mom).contribute(ethers.parseUnits("500", 6));
    await treasury.connect(dad).proposeWithdrawal(kid1.address, ethers.parseUnits("10", 6), "Snacks");

    await expect(treasury.connect(dad).approveProposal(0)).to.be.revertedWithCustomError(treasury, "AlreadyApproved");

    await treasury.connect(mom).approveProposal(0);
    await treasury.connect(kid1).approveProposal(0); // hits threshold, executes

    await expect(treasury.connect(kid2).approveProposal(0)).to.be.revertedWithCustomError(treasury, "AlreadyExecuted");
  });

  it("adds a new member only after threshold approvals", async function () {
    await treasury.connect(mom).proposeAddMember(outsider.address, "Grandma", "Add Grandma to the fund");
    await treasury.connect(dad).approveProposal(0);
    await treasury.connect(kid1).approveProposal(0);

    const m = await treasury.members(outsider.address);
    expect(m.active).to.equal(true);
    expect(m.name).to.equal("Grandma");
    expect(await treasury.activeMemberCount()).to.equal(5);
  });

  it("removing a member auto-lowers threshold if it would exceed remaining members", async function () {
    // shrink to threshold == activeMemberCount edge case
    await treasury.connect(mom).proposeChangeThreshold(4, "require unanimous");
    await treasury.connect(dad).approveProposal(0);
    await treasury.connect(kid1).approveProposal(0);
    expect(await treasury.threshold()).to.equal(4);

    // now remove a member -> threshold must drop to 3 automatically
    // (threshold is 4 right now, so removal itself needs all 4 members to approve)
    await treasury.connect(mom).proposeRemoveMember(kid2.address, "moved out");
    await treasury.connect(dad).approveProposal(1);
    await treasury.connect(kid1).approveProposal(1);
    await treasury.connect(kid2).approveProposal(1);

    expect(await treasury.activeMemberCount()).to.equal(3);
    expect(await treasury.threshold()).to.equal(3);
  });

  it("lets only the proposer cancel their own pending proposal", async function () {
    await treasury.connect(mom).contribute(ethers.parseUnits("10", 6));
    await treasury.connect(mom).proposeWithdrawal(kid1.address, 100, "test");
    await expect(treasury.connect(dad).cancelProposal(0)).to.be.revertedWithCustomError(treasury, "NotProposer");
    await treasury.connect(mom).cancelProposal(0);
    const p = await treasury.getProposal(0);
    expect(p.cancelled).to.equal(true);

    await expect(treasury.connect(dad).approveProposal(0)).to.be.revertedWithCustomError(treasury, "AlreadyCancelled");
  });

  it("blocks withdrawals larger than the treasury balance", async function () {
    await treasury.connect(mom).contribute(ethers.parseUnits("10", 6));
    await expect(
      treasury.connect(mom).proposeWithdrawal(kid1.address, ethers.parseUnits("999", 6), "too much")
    ).to.be.revertedWithCustomError(treasury, "InsufficientBalance");
  });
});
