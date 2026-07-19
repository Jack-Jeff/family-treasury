import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, decodeEventLog } from "viem";
import factoryAbi from "../lib/factoryAbi.json";
import { FACTORY_ADDRESS, DEFAULT_TOKEN_ADDRESS } from "../lib/wagmi";

export default function CreateTreasuryForm() {
  const { address: me, isConnected } = useAccount();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [token, setToken] = useState(DEFAULT_TOKEN_ADDRESS);
  const [threshold, setThreshold] = useState(2);
  const [rows, setRows] = useState([
    { address: "", name: "" },
    { address: "", name: "" },
  ]);
  const [error, setError] = useState("");
  const [deployedAddress, setDeployedAddress] = useState(null);
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    if (me && rows[0].address === "") {
      setRows((r) => {
        const copy = [...r];
        copy[0] = { address: me, name: copy[0].name || "Me" };
        return copy;
      });
    }
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const { writeContract, data: hash, isPending, error: txError, reset } = useWriteContract();
  const { data: receipt, isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && receipt) {
      setDecoding(true);
      const log = receipt.logs
        .map((l) => {
          try {
            return decodeEventLog({ abi: factoryAbi, data: l.data, topics: l.topics });
          } catch {
            return null;
          }
        })
        .find((e) => e?.eventName === "TreasuryCreated");
      setDecoding(false);
      if (log) {
        setDeployedAddress(log.args.treasury);
      }
    }
  }, [isSuccess, receipt]);

  const addRow = () => setRows((r) => [...r, { address: "", name: "" }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const validRows = rows.filter((r) => r.address && r.name);

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Give your treasury a name.");
    if (!isAddress(token)) return setError("Token address doesn't look valid.");
    if (validRows.length === 0) return setError("Add at least one signatory (address + name).");
    for (const r of validRows) {
      if (!isAddress(r.address)) return setError(`"${r.address}" isn't a valid wallet address.`);
    }
    const addrs = validRows.map((r) => r.address.toLowerCase());
    if (new Set(addrs).size !== addrs.length) return setError("You've listed the same wallet address twice.");
    if (threshold < 1 || threshold > validRows.length) {
      return setError(`Approval count must be between 1 and ${validRows.length}.`);
    }

    writeContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "createTreasury",
      args: [token, name.trim(), validRows.map((r) => r.address), validRows.map((r) => r.name), BigInt(threshold)],
    });
  };

  if (deployedAddress) {
    return (
      <div className="rounded-2xl border border-[var(--verified)]/40 bg-[var(--paper-dim)] p-6 text-center">
        <p className="font-display text-xl font-semibold mb-2">"{name}" is live 🎉</p>
        <p className="text-sm text-[var(--ink-soft)] mb-4 font-mono break-all">{deployedAddress}</p>
        <button
          onClick={() => navigate(`/treasury/${deployedAddress}`)}
          className="rounded-full bg-[var(--ink)] text-[var(--paper)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--verified)] transition-colors"
        >
          Open treasury
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6 text-sm text-[var(--ink-soft)]">
        Connect your wallet to create a treasury.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-6 space-y-4">
      <h2 className="font-display text-lg font-semibold">Create a treasury</h2>

      <Field label="Treasury name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ops Fund, Book Club Dues, The Smiths…"
          className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 text-sm focus:outline-none"
        />
      </Field>

      <Field label="Stablecoin contract address">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="0x…"
          className="w-full rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:outline-none"
        />
      </Field>

      <div>
        <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">Signatories</span>
        <div className="mt-1 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.address}
                onChange={(e) => updateRow(i, "address", e.target.value)}
                placeholder="0x… wallet address"
                className="flex-[2] min-w-0 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-xs focus:outline-none"
              />
              <input
                value={row.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 min-w-0 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 text-sm focus:outline-none"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-[var(--rust)] text-sm px-2"
                  aria-label="Remove signatory"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="text-sm text-[var(--brass)] font-medium mt-2 hover:underline">
          + Add another signatory
        </button>
      </div>

      <Field label={`Approvals required (out of ${validRows.length || "…"} signatories)`}>
        <input
          type="number"
          min="1"
          max={validRows.length || 1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-32 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:outline-none"
        />
      </Field>

      {(error || txError) && <p className="text-sm text-[var(--rust)]">{error || txError.shortMessage || txError.message}</p>}

      <button
        type="submit"
        disabled={isPending || waiting || decoding}
        className="w-full rounded-full bg-[var(--brass)] text-white py-2.5 text-sm font-medium hover:bg-[var(--brass-light)] transition-colors disabled:opacity-50"
      >
        {isPending || waiting ? "Deploying…" : "Create treasury"}
      </button>
    </form>
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
