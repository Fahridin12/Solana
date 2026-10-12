import React, { useState } from "react";
import { Coins, Send, Gift, RefreshCw, CheckCircle2, ArrowUpRight } from "lucide-react";

interface TokenSectionProps {
  tokenBalance: number;
  claimableAmount: number;
  tokenMint: string;
  hasProfile: boolean;
  onClaim: (amount: number) => Promise<string>;
  onTransfer: (recipient: string, amount: number) => Promise<string>;
}

export const TokenSection: React.FC<TokenSectionProps> = ({
  tokenBalance,
  claimableAmount,
  tokenMint,
  hasProfile,
  onClaim,
  onTransfer,
}) => {
  const [claimLoading, setClaimLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const handleClaim = async () => {
    if (claimableAmount <= 0) return;
    try {
      setClaimLoading(true);
      const sig = await onClaim(claimableAmount);
      setLastTx(sig);
    } catch (e) {
      console.error(e);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!recipient || isNaN(amt) || amt <= 0) return;
    try {
      setTransferLoading(true);
      const sig = await onTransfer(recipient, amt);
      setLastTx(sig);
      setRecipient("");
      setTransferAmount("");
    } catch (e) {
      console.error(e);
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-[#9945FF]" />
            <h3 className="font-bold text-lg text-white">Week 7: SPL Reward Tokens</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#9945FF]/10 text-[#9945FF] border border-[#9945FF]/20 font-bold uppercase tracking-wider">
            $QUEST
          </span>
        </div>

        {/* Balance & Claimable Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Your Token Balance</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-white font-mono">{tokenBalance.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#14F195]">QUEST</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Claimable Rewards</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-[#9945FF] font-mono">{claimableAmount.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-400">QUEST</span>
            </div>
          </div>
        </div>

        {/* Claim Rewards Button */}
        <button
          onClick={handleClaim}
          disabled={claimableAmount <= 0 || claimLoading || !hasProfile}
          className="w-full mb-6 bg-gradient-to-r from-[#9945FF] to-[#7928CA] text-white font-extrabold text-sm py-3 rounded-xl hover:opacity-90 shadow-lg shadow-[#9945FF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {claimLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Gift className="w-4 h-4" />
          )}
          <span>
            {claimLoading
              ? "Minting via CPI..."
              : claimableAmount > 0
              ? `Claim ${claimableAmount.toFixed(2)} QUEST Rewards`
              : "No Unclaimed Rewards"}
          </span>
        </button>

        {/* Transfer Form */}
        <form onSubmit={handleTransfer} className="space-y-3 pt-4 border-t border-white/10">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Transfer SPL Tokens
          </span>
          <input
            type="text"
            required
            placeholder="Recipient Solana Address..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-[#0c0d14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#9945FF]"
          />
          <div className="flex space-x-2">
            <input
              type="number"
              step="any"
              min="0.000001"
              max={tokenBalance}
              required
              placeholder="Amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-1/2 bg-[#0c0d14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#9945FF]"
            />
            <button
              type="submit"
              disabled={transferLoading || tokenBalance <= 0 || !recipient}
              className="w-1/2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {transferLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Tokens</span>
            </button>
          </div>
        </form>
      </div>

      {lastTx && (
        <div className="mt-4 p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Success:</span>
          </span>
          <a
            href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-[#14F195] hover:underline flex items-center space-x-1 font-mono text-[11px]"
          >
            <span>{lastTx.slice(0, 8)}...{lastTx.slice(-8)}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
