# Family Treasury

An onchain multisig for family savings, built for Monad.

- Every contribution is logged and attributed on-chain — no more "whose money is this?"
- Withdrawals need M-of-N signatory approval (e.g. 3 of 5), configurable by the family itself
- Adding/removing signatories and changing the approval rule are themselves governed by the same approval process
- Full history is public and auditable by any member (or anyone, on a public block explorer)

## Structure

```
contracts/   Solidity contract (FamilyTreasury.sol) + tests + deploy script
frontend/    React dApp: contribute, propose, approve, and track balances
```

## Quickstart

### 1. Deploy the contract

```bash
cd contracts
cp .env.example .env        # fill in DEPLOYER_PRIVATE_KEY and USDC_ADDRESS
```

Edit `scripts/deploy.js` — set `treasuryName`, `members` (address + display name per
signatory), and `threshold` (how many approvals a withdrawal needs).

```bash
npm install
node scripts/compile.js     # compiles locally, no external downloads needed
npx hardhat run scripts/deploy.js --network monadTestnet
```

This prints the deployed contract address and the two env vars the frontend needs.

### 2. Run the frontend

```bash
cd frontend
cp .env.example .env        # paste in VITE_TREASURY_ADDRESS and VITE_USDC_ADDRESS
npm install
npm run dev
```

Open the printed local URL, connect a wallet (MetaMask or similar) on Monad Testnet,
and you're live.

## About the USDC address

Monad testnet token addresses can change when the testnet resets, and mainnet USDC's
canonical address should always be verified directly before you send real funds to it.
Look it up on Monad's own docs (`docs.monad.xyz`) or a trusted explorer
(`testnet.monadexplorer.com` / `monadvision.com`) at deploy time rather than trusting a
hardcoded value here — that's why `USDC_ADDRESS` is left blank in `.env.example`.

## How the contract works

- **Members** hold a name + running contribution total. Only active members can
  contribute or propose/approve anything.
- **Proposals** are one of: withdraw funds, add a member, remove a member, or change
  the approval threshold. Creating a proposal counts as the proposer's own approval.
- Once a proposal collects `threshold` approvals it **executes automatically** on the
  approval that crosses the line (a manual `executeProposal` is also exposed as a
  fallback).
- Removing a member automatically lowers the threshold if it would otherwise exceed
  the remaining member count, so the treasury never locks itself out.

Run the test suite (`cd contracts && npx hardhat test --no-compile`) to see all of this
exercised end to end, including edge cases like double-approval and insufficient-balance
guards.

## Security note

This contract has not been audited. It's a solid, tested starting point for a family's
own funds at a reasonable scale, but if you're planning to hold significant value,
get a professional review first — the same way you would with any smart contract.
