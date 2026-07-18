import { formatUsdc, shortAddr, timeAgo } from "../lib/format";

export default function ContributionHistory({ contributions, decimals, symbol }) {
  return (
    <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6">
      <h2 className="font-display text-lg font-semibold mb-4">Contribution history</h2>
      {contributions.length === 0 && (
        <p className="text-sm text-[var(--ink-soft)]">No contributions logged yet.</p>
      )}
      <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {contributions.map((c) => (
          <li key={c.key} className="flex items-center justify-between text-sm border-b border-[var(--paper-line)] pb-2 last:border-0">
            <div className="min-w-0">
              <p className="font-medium truncate">{c.name || shortAddr(c.contributor)}</p>
              <p className="text-xs text-[var(--ink-soft)] font-mono">{shortAddr(c.contributor)} · {timeAgo(c.timestamp)}</p>
            </div>
            <p className="font-mono shrink-0 ml-3">
              +${formatUsdc(c.amount, decimals)} {symbol}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
