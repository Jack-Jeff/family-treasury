export function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatUsdc(raw, decimals = 6) {
  if (raw === undefined || raw === null) return "0.00";
  const value = Number(raw) / 10 ** decimals;
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeAgo(unixSeconds) {
  const ts = Number(unixSeconds) * 1000;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export const PROPOSAL_TYPES = ["Withdrawal", "AddMember", "RemoveMember", "ChangeThreshold"];

export function proposalLabel(p) {
  switch (PROPOSAL_TYPES[p.proposalType]) {
    case "Withdrawal":
      return "Withdrawal";
    case "AddMember":
      return "Add signatory";
    case "RemoveMember":
      return "Remove signatory";
    case "ChangeThreshold":
      return "Change approval rule";
    default:
      return "Proposal";
  }
}
