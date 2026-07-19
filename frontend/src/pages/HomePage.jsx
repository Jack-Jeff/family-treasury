import WalletBar from "../components/WalletBar";
import MyTreasuries from "../components/MyTreasuries";
import CreateTreasuryForm from "../components/CreateTreasuryForm";
import { activeChain } from "../lib/wagmi";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--paper-line)]">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SealMark />
            <span className="font-display font-semibold text-lg">Fundo</span>
            <span className="text-xs font-mono text-[var(--ink-soft)] ml-1">{activeChain.name}</span>
          </div>
          <WalletBar />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-3">
            Onchain group treasuries
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
            Every group, their own ledger.
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <MyTreasuries />
          <CreateTreasuryForm />
        </div>
      </main>
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
