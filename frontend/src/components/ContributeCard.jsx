import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import treasuryAbi from "../lib/treasuryAbi.json";
import { erc20Abi } from "../lib/erc20Abi";
import { formatUsdc } from "../lib/format";

export default function ContributeCard({ treasuryAddress, tokenAddress, decimals, symbol, myBalance, myAllowance, isMember, onDone }) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { writeContract: writeContribute, data: contributeHash, isPending: contributing } = useWriteContract();

  const { isLoading: waitingApprove, isSuccess: approveDone } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: waitingContribute, isSuccess: contributeDone } = useWaitForTransactionReceipt({ hash: contributeHash });

  useEffect(() => {
    if (contributeDone) {
      setAmount("");
      onDone?.();
    }
  }, [contributeDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (approveDone) onDone?.();
  }, [approveDone]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConnected) {
    return (
      <Card>
        <p className="text-sm text-[var(--ink-soft)]">Connect your wallet to contribute.</p>
      </Card>
    );
  }

  if (!isMember) {
    return (
      <Card>
        <p className="text-sm text-[var(--ink-soft)]">
          This wallet isn't a signatory on this treasury yet. Ask an existing member to propose adding you.
        </p>
      </Card>
    );
  }

  let amountUnits;
  try {
    amountUnits = amount ? parseUnits(amount, decimals) : 0n;
  } catch {
    amountUnits = 0n;
  }

  const needsApproval = myAllowance !== undefined && amountUnits > 0n && amountUnits > myAllowance;
  const insufficientBalance = myBalance !== undefined && amountUnits > myBalance;

  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)] mb-1">Your wallet</p>
      <p className="font-mono text-sm mb-4">
        ${formatUsdc(myBalance, decimals)} {symbol} available
      </p>

      <label className="text-xs uppercase tracking-wide text-[var(--ink-soft)]" htmlFor="contribute-amount">
        Add funds
      </label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] font-mono">$</span>
          <input
            id="contribute-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] pl-7 pr-3 py-2.5 font-mono text-sm focus:outline-none"
          />
        </div>
      </div>

      {insufficientBalance && amount && (
        <p className="text-xs text-[var(--rust)] mt-2">Amount exceeds your {symbol} balance.</p>
      )}

      <div className="mt-4">
        {needsApproval ? (
          <button
            disabled={approving || waitingApprove || !amountUnits || insufficientBalance}
            onClick={() => writeApprove({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [treasuryAddress, amountUnits] })}
            className="w-full rounded-full bg-[var(--brass)] text-white py-2.5 text-sm font-medium hover:bg-[var(--brass-light)] transition-colors disabled:opacity-50"
          >
            {approving || waitingApprove ? "Approving…" : `Approve ${symbol}`}
          </button>
        ) : (
          <button
            disabled={contributing || waitingContribute || !amountUnits || insufficientBalance}
            onClick={() => writeContribute({ address: treasuryAddress, abi: treasuryAbi, functionName: "contribute", args: [amountUnits] })}
            className="w-full rounded-full bg-[var(--ink)] text-[var(--paper)] py-2.5 text-sm font-medium hover:bg-[var(--verified)] transition-colors disabled:opacity-50"
          >
            {contributing || waitingContribute ? "Contributing…" : "Contribute"}
          </button>
        )}
      </div>
    </Card>
  );
}

function Card({ children }) {
  return <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6">{children}</div>;
}
