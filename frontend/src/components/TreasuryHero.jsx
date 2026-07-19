import { formatUsdc } from "../lib/format";

export default function TreasuryHero({ name, balance, decimals, symbol, threshold, memberCount }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] px-8 py-10 sm:px-12 sm:py-14">
      {/* ledger rule lines, decorative */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent, transparent 39px, var(--paper-line) 40px)",
        }}
      />
      <div className="relative">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-3">
          Group Treasury · Onchain Ledger
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-6 max-w-xl">
          {name || "Loading…"}
        </h1>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)] mb-1">Balance</p>
            <p className="font-mono text-4xl font-semibold">
              ${formatUsdc(balance, decimals)}
              <span className="text-lg ml-2 text-[var(--ink-soft)]">{symbol}</span>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)] mb-1">Approval rule</p>
            <p className="font-mono text-xl font-medium">
              {threshold ?? "–"} of {memberCount ?? "–"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
