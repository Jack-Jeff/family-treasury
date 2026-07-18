import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "../lib/format";
import { activeChain } from "../lib/wagmi";

export default function WalletBar() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const wrongChain = isConnected && chainId !== activeChain.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="rounded-full bg-[var(--ink)] text-[var(--paper)] px-5 py-2.5 text-sm font-medium tracking-wide hover:bg-[var(--brass)] transition-colors disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {wrongChain && (
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--rust)]/10 text-[var(--rust)] border border-[var(--rust)]/30">
          Wrong network — switch to {activeChain.name}
        </span>
      )}
      <span className="font-mono text-sm px-3 py-2 rounded-full bg-[var(--paper-dim)] border border-[var(--paper-line)]">
        {shortAddr(address)}
      </span>
      <button
        onClick={() => disconnect()}
        className="text-sm text-[var(--ink-soft)] hover:text-[var(--rust)] transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
