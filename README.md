# Fundo — Onchain Group Treasuries

A platform where anyone can spin up their own shared treasury on Monad — for a
family, a team, a club, or any group that pools money together. Name it, add
signatories with nicknames, set an M-of-N approval rule, and go. Every group's
treasury is a fully independent contract — no shared admin, no central control.

- Every contribution is logged and attributed on-chain — no more "whose money is this?"
- Withdrawals need M-of-N signatory approval (e.g. 3 of 5), configurable per treasury
- Adding/removing signatories and changing the approval rule are themselves governed
  by the same approval process
- Full history is public and auditable by any member (or anyone, on a public block explorer)

## Structure

```
contracts/   Solidity: FamilyTreasury.sol (one group's vault) +
             FamilyTreasuryFactory.sol (deploys + indexes treasuries) + tests
frontend/    React dApp: create a treasury, see the ones you belong to,
             contribute, propose, approve, track history
```

## Quickstart

### 1. Deploy the factory (one-time)

```bash
cd contracts
cp .env.example .env        # fill in DEPLOYER_PRIVATE_KEY
npm install
node scripts/compile.js     # compiles locally, no external downloads needed
npx hardhat run scripts/deploy-factory.js --network monadTestnet
```

This prints the factory's address — that's the only contract you deploy by hand.
From here on, new treasuries are created through the frontend, not the command line.

Optional: `npx hardhat run scripts/deploy-mock-usdc.js --network monadTestnet` deploys
a free test stablecoin (mintable) so you can try things out without hunting for a real
USDC address on testnet.

### 2. Run the frontend

```bash
cd frontend
cp .env.example .env        # paste in VITE_FACTORY_ADDRESS (and optionally VITE_DEFAULT_TOKEN_ADDRESS)
npm install
npm run dev
```

Open the printed local URL, connect a wallet, click **Create treasury**, and you're live.
Each treasury gets its own page at `/treasury/0x...` you can share with that group.

## About token addresses

Monad testnet token addresses can change when the testnet resets, and mainnet USDC's
canonical address should always be verified directly before you send real funds to it.
Look it up on Monad's own docs (`docs.monad.xyz`) or a trusted explorer at deploy/create
time rather than trusting a hardcoded value — the create-treasury form asks for a token
address explicitly so nothing is assumed for you.

## How it works

- **Factory**: one contract, deployed once. `createTreasury(...)` deploys a brand new,
  fully independent `FamilyTreasury` and indexes it by each initial member's address so
  they can find it again from the homepage. (Members added *later*, via a proposal, aren't
  auto-indexed — they'll need the treasury's link shared with them directly.)
- **Treasury**: holds a name, a stablecoin balance, a list of signatories with running
  contribution totals, and a threshold. Proposals cover withdrawals, adding/removing
  signatories, and changing the threshold — all gated by the same M-of-N approval.
  Creating a proposal counts as the proposer's own approval, and it executes itself the
  moment the last needed approval lands.
- Removing a member automatically lowers the threshold if it would otherwise exceed the
  remaining member count, so a treasury never locks itself out.

Run the test suite (`cd contracts && npx hardhat test --no-compile`) to see all of this
exercised end to end — 11 tests covering both contracts.

## Security note

Neither contract has been audited. Solid, tested starting points for real-world use at
a reasonable scale — but if you're planning to route significant value through this,
get a professional review first, the same way you would with any smart contract.
