import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import treasuryAbi from "./treasuryAbi.json";
import { erc20Abi } from "./erc20Abi";

export function useTreasuryData(treasuryAddress) {
  const { address: me } = useAccount();
  const treasury = { address: treasuryAddress, abi: treasuryAbi };

  const core = useReadContracts({
    contracts: [
      { ...treasury, functionName: "treasuryName" },
      { ...treasury, functionName: "threshold" },
      { ...treasury, functionName: "activeMemberCount" },
      { ...treasury, functionName: "treasuryBalance" },
      { ...treasury, functionName: "getMemberList" },
      { ...treasury, functionName: "proposalCount" },
      { ...treasury, functionName: "getContributions", args: [0n, 1000n] },
      { ...treasury, functionName: "token" },
    ],
    query: { enabled: !!treasuryAddress, refetchInterval: 6000 },
  });

  const [
    treasuryName,
    threshold,
    activeMemberCount,
    treasuryBalance,
    memberList,
    proposalCount,
    contributionsRaw,
    tokenAddress,
  ] = (core.data || []).map((r) => r?.result);

  const usdc = { address: tokenAddress, abi: erc20Abi };

  const tokenReads = useReadContracts({
    contracts: [
      { ...usdc, functionName: "decimals" },
      { ...usdc, functionName: "symbol" },
      me ? { ...usdc, functionName: "balanceOf", args: [me] } : null,
      me ? { ...usdc, functionName: "allowance", args: [me, treasuryAddress] } : null,
    ].filter(Boolean),
    query: { enabled: !!tokenAddress, refetchInterval: 6000 },
  });

  const [usdcDecimals, usdcSymbol, myUsdcBalance, myAllowance] = (tokenReads.data || []).map((r) => r?.result);

  const memberAddrs = memberList || [];

  const memberReads = useReadContracts({
    contracts: memberAddrs.map((addr) => ({ ...treasury, functionName: "members", args: [addr] })),
    query: { enabled: memberAddrs.length > 0, refetchInterval: 6000 },
  });

  const members = useMemo(() => {
    return memberAddrs
      .map((addr, i) => {
        const r = memberReads.data?.[i]?.result;
        if (!r) return null;
        const [name, active, joinedAt, totalContributed] = r;
        return { address: addr, name, active, joinedAt, totalContributed };
      })
      .filter((m) => m && m.active);
  }, [memberAddrs, memberReads.data]);

  const pCount = Number(proposalCount || 0n);
  const ids = Array.from({ length: pCount }, (_, i) => i);

  const proposalReads = useReadContracts({
    contracts: ids.map((id) => ({ ...treasury, functionName: "getProposal", args: [BigInt(id)] })),
    query: { enabled: pCount > 0, refetchInterval: 6000 },
  });

  const approvalReads = useReadContracts({
    contracts: me ? ids.map((id) => ({ ...treasury, functionName: "hasApproved", args: [BigInt(id), me] })) : [],
    query: { enabled: pCount > 0 && !!me, refetchInterval: 6000 },
  });

  const proposals = useMemo(() => {
    return ids
      .map((id) => {
        const r = proposalReads.data?.[id]?.result;
        if (!r) return null;
        const approved = approvalReads.data?.[id]?.result ?? false;
        return { id, ...r, myApproval: approved };
      })
      .filter(Boolean)
      .reverse();
  }, [ids, proposalReads.data, approvalReads.data]);

  const contributions = useMemo(() => {
    if (!contributionsRaw) return [];
    return [...contributionsRaw]
      .map((c, i) => ({
        contributor: c.contributor,
        amount: c.amount,
        timestamp: c.timestamp,
        name: members.find((m) => m.address?.toLowerCase() === c.contributor?.toLowerCase())?.name,
        key: `${c.contributor}-${i}`,
      }))
      .reverse();
  }, [contributionsRaw, members]);

  return {
    isLoading: core.isLoading,
    treasuryAddress,
    tokenAddress,
    treasuryName,
    threshold: threshold !== undefined ? Number(threshold) : undefined,
    activeMemberCount: activeMemberCount !== undefined ? Number(activeMemberCount) : undefined,
    treasuryBalance,
    usdcDecimals: usdcDecimals ?? 6,
    usdcSymbol: usdcSymbol ?? "TOKEN",
    myUsdcBalance,
    myAllowance,
    members,
    proposals,
    contributions,
    isMember: !!members.find((m) => m.address?.toLowerCase() === me?.toLowerCase()),
    refetch: () => {
      core.refetch();
      tokenReads.refetch();
      memberReads.refetch();
      proposalReads.refetch();
      approvalReads.refetch();
    },
  };
}
