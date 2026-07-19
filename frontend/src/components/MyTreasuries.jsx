import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { Link } from "react-router-dom";
import factoryAbi from "../lib/factoryAbi.json";
import treasuryAbi from "../lib/treasuryAbi.json";
import { FACTORY_ADDRESS } from "../lib/wagmi";
import { shortAddr } from "../lib/format";

export default function MyTreasuries() {
  const { address: me, isConnected } = useAccount();

  const { data: addresses, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getTreasuriesForMember",
    args: me ? [me] : undefined,
    query: { enabled: !!me, refetchInterval: 8000 },
  });

  const nameReads = useReadContracts({
    contracts: (addresses || []).map((addr) => ({ address: addr, abi: treasuryAbi, functionName: "treasuryName" })),
    query: { enabled: !!addresses && addresses.length > 0 },
  });

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6 text-sm text-[var(--ink-soft)]">
        Connect your wallet to see treasuries you're part of.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6">
      <h2 className="font-display text-lg font-semibold mb-4">Your treasuries</h2>
      {isLoading && <p className="text-sm text-[var(--ink-soft)]">Loading…</p>}
      {!isLoading && (!addresses || addresses.length === 0) && (
        <p className="text-sm text-[var(--ink-soft)]">
          No treasuries yet for {shortAddr(me)}. Create one, or ask an existing member to add your wallet as a
          signatory and share the treasury link with you.
        </p>
      )}
      <ul className="space-y-2">
        {addresses?.map((addr, i) => (
          <li key={addr}>
            <Link
              to={`/treasury/${addr}`}
              className="flex items-center justify-between rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-4 py-3 text-sm hover:border-[var(--brass)] transition-colors"
            >
              <span className="font-medium">{nameReads.data?.[i]?.result || shortAddr(addr)}</span>
              <span className="text-[var(--brass)] font-mono text-xs">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
