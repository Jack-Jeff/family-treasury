import { useState, useEffect } from "react";
import { parseUnits, isAddress } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import treasuryAbi from "../lib/treasuryAbi.json";


const TABS = [
  { key: "withdraw", label: "Withdraw" },
  { key: "add", label: "Add signatory" },
  { key: "remove", label: "Remove signatory" },
  { key: "threshold", label: "Change rule" },
];

export default function NewProposalForm({ treasuryAddress, decimals, isMember, memberCount, onCreated }) {
  const [tab, setTab] = useState("withdraw");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setTo("");
      setAmount("");
      setName("");
      setDescription("");
      setThreshold("");
      reset();
      onCreated?.();
    }
  }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isMember) return null;

  const submit = (e) => {
    e.preventDefault();
    if (tab === "withdraw") {
      if (!isAddress(to) || !amount) return;
      writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "proposeWithdrawal",
        args: [to, parseUnits(amount, decimals), description || "Withdrawal"],
      });
    } else if (tab === "add") {
      if (!isAddress(to) || !name) return;
      writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "proposeAddMember",
        args: [to, name, description || `Add ${name}`],
      });
    } else if (tab === "remove") {
      if (!isAddress(to)) return;
      writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "proposeRemoveMember",
        args: [to, description || "Remove signatory"],
      });
    } else if (tab === "threshold") {
      if (!threshold) return;
      writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "proposeChangeThreshold",
        args: [BigInt(threshold), description || "Change approval rule"],
      });
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6">
      <h2 className="font-display text-lg font-semibold mb-4">New ledger entry</h2>

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              tab === t.key
                ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
                : "border-[var(--paper-line)] text-[var(--ink-soft)] hover:border-[var(--ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {(tab === "withdraw" || tab === "add" || tab === "remove") && (
          <Field label={tab === "remove" ? "Signatory address to remove" : "Recipient address"}>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </Field>
        )}

        {tab === "withdraw" && (
          <Field label="Amount (USDC)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </Field>
        )}

        {tab === "add" && (
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grandma"
              className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        )}

        {tab === "threshold" && (
          <Field label={`New approval count (max ${memberCount ?? "?"})`}>
            <input
              type="number"
              min="1"
              max={memberCount}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="3"
              className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </Field>
        )}

        <Field label="Reason (shown to everyone in the group)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Venue deposit for the offsite"
            className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 text-sm focus:outline-none"
          />
        </Field>

        <button
          type="submit"
          disabled={isPending || waiting}
          className="w-full rounded-full bg-[var(--brass)] text-white py-2.5 text-sm font-medium hover:bg-[var(--brass-light)] transition-colors disabled:opacity-50"
        >
          {isPending || waiting ? "Confirming…" : "Propose"}
        </button>
        {error && <p className="text-xs text-[var(--rust)]">{error.shortMessage || error.message}</p>}
        <p className="text-xs text-[var(--ink-soft)]">Proposing counts as your own first approval.</p>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
