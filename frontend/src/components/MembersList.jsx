import { shortAddr, formatUsdc } from "../lib/format";

export default function MembersList({ members, decimals }) {
  return (
    <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6">
      <h2 className="font-display text-lg font-semibold mb-4">Signatories</h2>
      <ul className="space-y-3">
        {members.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No members loaded yet.</p>}
        {members.map((m) => (
          <li key={m.address} className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-display text-sm">
              {m.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{m.name}</p>
              <p className="font-mono text-xs text-[var(--ink-soft)]">{shortAddr(m.address)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm">${formatUsdc(m.totalContributed, decimals)}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">contributed</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
