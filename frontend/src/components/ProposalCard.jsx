import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import treasuryAbi from "../lib/treasuryAbi.json";
import { formatUsdc, shortAddr, timeAgo, proposalLabel, PROPOSAL_TYPES } from "../lib/format";
import ApprovalSeal from "./ApprovalSeal";

export default function ProposalCard({ treasuryAddress, proposal, threshold, decimals, symbol, isMember, onDone }) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  const type = PROPOSAL_TYPES[proposal.proposalType];
  const status = proposal.executed ? "executed" : proposal.cancelled ? "cancelled" : "pending";

  if (isSuccess) onDone?.();

  const approve = () =>
    writeContract({ address: treasuryAddress, abi: treasuryAbi, functionName: "approveProposal", args: [BigInt(proposal.id)] });
  const execute = () =>
    writeContract({ address: treasuryAddress, abi: treasuryAbi, functionName: "executeProposal", args: [BigInt(proposal.id)] });

  return (
    <div className="flex gap-4 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] p-5">
      <ApprovalSeal total={threshold} filled={proposal.approvalCount} executed={proposal.executed} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
            No. {String(proposal.id).padStart(4, "0")}
          </span>
          <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-[var(--paper-line)]">
            {proposalLabel(proposal)}
          </span>
          <StatusPill status={status} />
        </div>

        <p className="font-display text-lg font-medium mb-1">
          {type === "Withdrawal" && (
            <>
              ${formatUsdc(proposal.amount, decimals)} {symbol} to {shortAddr(proposal.target)}
            </>
          )}
          {type === "AddMember" && <>Add {proposal.name} as a signatory</>}
          {type === "RemoveMember" && <>Remove {shortAddr(proposal.target)} as a signatory</>}
          {type === "ChangeThreshold" && <>Require {String(proposal.amount)} approvals going forward</>}
        </p>

        {proposal.description && <p className="text-sm text-[var(--ink-soft)] mb-2">{proposal.description}</p>}

        <p className="text-xs text-[var(--ink-soft)] mb-3">
          Proposed by {shortAddr(proposal.proposer)} · {timeAgo(proposal.createdAt)}
        </p>

        {status === "pending" && isMember && (
          <div className="flex items-center gap-3">
            {!proposal.myApproval ? (
              <button
                disabled={isPending || waiting}
                onClick={approve}
                className="rounded-full bg-[var(--brass)] text-white px-4 py-1.5 text-sm font-medium hover:bg-[var(--brass-light)] transition-colors disabled:opacity-50"
              >
                {isPending || waiting ? "Confirming…" : "Approve"}
              </button>
            ) : (
              <span className="text-sm text-[var(--verified)] font-medium">You approved this</span>
            )}
            {proposal.approvalCount >= threshold && (
              <button
                disabled={isPending || waiting}
                onClick={execute}
                className="rounded-full bg-[var(--ink)] text-[var(--paper)] px-4 py-1.5 text-sm font-medium hover:bg-[var(--verified)] transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            )}
          </div>
        )}
        {error && <p className="text-xs text-[var(--rust)] mt-2">{error.shortMessage || error.message}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    pending: "text-[var(--brass)] border-[var(--brass)]/40",
    executed: "text-[var(--verified)] border-[var(--verified)]/40",
    cancelled: "text-[var(--rust)] border-[var(--rust)]/40",
  };
  return (
    <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}
