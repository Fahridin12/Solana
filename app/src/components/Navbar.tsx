import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const Navbar: React.FC<{ network: string; balance: number | null }> = ({
  network,
  balance,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#12131c]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center font-black text-xl text-black shadow-lg shadow-[#9945FF]/20">
            SQ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SolQuest
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 uppercase tracking-wider">
                {network}
              </span>
            </div>
            <p className="text-xs text-slate-400">Solana Web3 MVP Hub (Weeks 3–8)</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {balance !== null && (
            <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400 text-[10px]">Devnet Balance</span>
              <span className="font-mono font-bold text-[#14F195]">
                {balance.toFixed(4)} SOL
              </span>
            </div>
          )}
          <WalletMultiButton className="!bg-gradient-to-r !from-[#9945FF] !to-[#7928CA] !hover:opacity-90 !rounded-xl !font-bold !text-sm !h-11 !px-5 !shadow-lg !shadow-[#9945FF]/25 !transition-all" />
        </div>
      </div>
    </header>
  );
};
