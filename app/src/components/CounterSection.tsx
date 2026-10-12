import React, { useState } from "react";
import { Zap, ArrowUpRight, Flame, RefreshCw, CheckCircle2 } from "lucide-react";

interface CounterSectionProps {
  counter: number;
  hasProfile: boolean;
  onIncrement: () => Promise<string>;
}

export const CounterSection: React.FC<CounterSectionProps> = ({
  counter,
  hasProfile,
  onIncrement,
}) => {
  const [loading, setLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const handleIncrement = async () => {
    try {
      setLoading(true);
      const sig = await onIncrement();
      setLastSignature(sig);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-[#14F195]" />
          <h3 className="font-bold text-lg text-white">Week 5: Counter Program</h3>
        </div>
        <span className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 font-medium">
          <Flame className="w-3.5 h-3.5" />
          <span>On-Chain State</span>
        </span>
      </div>

      <div className="my-6 text-center">
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-[#0c0d14] border border-white/10 rounded-3xl px-10 py-6">
            <span className="block text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#14F195] font-mono tracking-wider">
              {counter}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1 block">
              Total User Actions
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Every counter tick awards <span className="text-[#14F195] font-bold">+100 XP</span> and unlocks <span className="text-[#9945FF] font-bold">10 QUEST</span> tokens!
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleIncrement}
          disabled={!hasProfile || loading}
          className="w-full bg-gradient-to-r from-[#14F195] to-[#00C278] text-black font-extrabold text-sm py-3.5 rounded-xl hover:opacity-95 shadow-lg shadow-[#14F195]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-black" />
          )}
          <span>{loading ? "Confirming on Solana..." : "Increment Counter"}</span>
        </button>

        {!hasProfile && (
          <p className="text-[11px] text-yellow-400 text-center">
            ⚠️ Initialize your profile first to unlock counter increments.
          </p>
        )}

        {lastSignature && (
          <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed Tx:</span>
            </span>
            <a
              href={`https://explorer.solana.com/tx/${lastSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-[#14F195] hover:underline flex items-center space-x-1 font-mono text-[11px]"
            >
              <span>{lastSignature.slice(0, 8)}...{lastSignature.slice(-8)}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
