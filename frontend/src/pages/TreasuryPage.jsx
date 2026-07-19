import { Link, useParams } from "react-router-dom";
import { isAddress } from "viem";
import WalletBar from "../components/WalletBar";
import TreasuryHero from "../components/TreasuryHero";
import ContributeCard from "../components/ContributeCard";
import MembersList from "../components/MembersList";
import ContributionHistory from "../components/ContributionHistory";
import ProposalCard from "../components/ProposalCard";
import NewProposalForm from "../components/NewProposalForm";
import { useTreasuryData } from "../lib/useTreasuryData";
import { activeChain } from "../lib/wagmi";

export default function TreasuryPage() {
  const { address } = useParams();

  if (!isAddress(address || "")) {
    return <BadAddress />;
  }

  return <TreasuryPageInner address={address} />;
}

function TreasuryPageInner({ address }) {
  const data = useTreasuryData(address);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--paper-line)]">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="text-[var(--ink-soft)] hover:text-[var(--ink)] shrink-0" aria-label="Back to home">
              ←
            </Link>
            <SealMark />
            <span className="font-display font-semibold text-lg truncate">{data.treasuryName || "Loading…"}</span>
            <span className="text-xs font-mono text-[var(--ink-soft)] ml-1 shrink-0">{activeChain.name}</span>
          </div>
          <WalletBar />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <TreasuryHero
          name={data.treasuryName}
          balance={data.treasuryBalance}
          decimals={data.usdcDecimals}
          symbol={data.usdcSymbol}
          threshold={data.threshold}
          memberCount={data.activeMemberCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ContributeCard
              treasuryAddress={data.treasuryAddress}
              tokenAddress={data.tokenAddress}
              decimals={data.usdcDecimals}
              symbol={data.usdcSymbol}
              myBalance={data.myUsdcBalance}
              myAllowance={data.myAllowance}
              isMember={data.isMember}
              onDone={data.refetch}
            />
            <MembersList members={data.members} decimals={data.usdcDecimals} />
            <ContributionHistory contributions={data.contributions} decimals={data.usdcDecimals} symbol={data.usdcSymbol} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <NewProposalForm
              treasuryAddress={data.treasuryAddress}
              decimals={data.usdcDecimals}
              isMember={data.isMember}
              memberCount={data.activeMemberCount}
              onCreated={data.refetch}
            />

            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Ledger entries</h2>
              <div className="space-y-3">
                {data.proposals.length === 0 && (
                  <p className="text-sm text-[var(--ink-soft)]">No proposals yet. The first entry starts the ledger.</p>
                )}
                {data.proposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    treasuryAddress={data.treasuryAddress}
                    proposal={p}
                    threshold={data.threshold}
                    decimals={data.usdcDecimals}
                    symbol={data.usdcSymbol}
                    isMember={data.isMember}
                    onDone={data.refetch}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-[var(--ink-soft)] font-mono">
        Contract: {data.treasuryAddress}
      </footer>
    </div>
  );
}

function SealMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--brass)" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="var(--brass)" />
    </svg>
  );
}

function BadAddress() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-8 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">That's not a valid treasury link</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-4">The address in the URL doesn't look right.</p>
        <Link to="/" className="text-[var(--brass)] font-medium hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
