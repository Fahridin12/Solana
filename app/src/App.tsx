import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "./components/Navbar";
import { ProfileCard } from "./components/ProfileCard";
import { CounterSection } from "./components/CounterSection";
import { TokenSection } from "./components/TokenSection";
import { PdaExplorer } from "./components/PdaExplorer";
import { useSolQuest } from "./hooks/useSolQuest";
import { CheckCircle2, Code2, Layers, Cpu, Sparkles } from "lucide-react";

export const App: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    loading,
    solBalance,
    profile,
    pdaAddress,
    pdaBump,
    tokenBalance,
    claimableRewards,
    createProfile,
    incrementCounter,
    claimRewards,
    transferRewards,
    refetch,
    programId,
  } = useSolQuest();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c13] text-slate-100">
      <Navbar network="devnet" balance={solBalance} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#161826] to-[#0f1019] border border-white/10 p-8 sm:p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#9945FF]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-[#14F195]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#14F195] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Solana Build Sprint MVP (Weeks 3–8)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Decentralized Quests, Profiles & Token Rewards
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              A unified on-chain architecture merging Rust CLI commands, Counter state, PDA user profiles, SPL token CPI minting, and a real-time reactive dApp interface.
            </p>
          </div>

          {/* Syllabus Milestones Checklist */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { week: "Week 3", title: "Rust CLI", done: true },
              { week: "Week 4", title: "Devnet Deploy", done: true },
              { week: "Week 5", title: "Counter Program", done: true },
              { week: "Week 6", title: "PDA Profiles", done: true },
              { week: "Week 7", title: "SPL Tokens", done: true },
              { week: "Week 8", title: "Web3 MVP", done: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#14F195] flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{item.week}</div>
                  <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!connected ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5 mb-4">
              <div className="w-full h-full bg-[#12131c] rounded-[14px] flex items-center justify-center">
                <Cpu className="w-8 h-8 text-[#14F195]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Solana Wallet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Connect Phantom, Solflare, or Backpack on Devnet to interact with the on-chain smart contract, initialize your profile PDA, and earn QUEST tokens.
            </p>
          </div>
        ) : (
          <>
            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card (Week 6) */}
              <div className="lg:col-span-1">
                <ProfileCard
                  profile={profile}
                  pdaAddress={pdaAddress}
                  loading={loading}
                  onCreateProfile={createProfile}
                  onRefresh={refetch}
                />
              </div>

              {/* Counter Program (Week 5) */}
              <div className="lg:col-span-1">
                <CounterSection
                  counter={profile ? profile.counter : 0}
                  hasProfile={!!profile}
                  onIncrement={incrementCounter}
                />
              </div>

              {/* SPL Token Rewards (Week 7) */}
              <div className="lg:col-span-1">
                <TokenSection
                  tokenBalance={tokenBalance}
                  claimableAmount={claimableRewards}
                  tokenMint={appConfig.rewardMint}
                  hasProfile={!!profile}
                  onClaim={claimRewards}
                  onTransfer={transferRewards}
                />
              </div>
            </div>

            {/* Architecture / PDA Deep Dive (Week 6) */}
            <PdaExplorer
              programId={programId}
              walletPubkey={publicKey ? publicKey.toBase58() : null}
              pdaAddress={pdaAddress}
              bump={pdaBump}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0c0d14] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SolQuest Web3 MVP — Unified Weeks 3 through 8</span>
          <span className="font-mono text-slate-400">
            Program ID: <code className="text-slate-300">{programId}</code>
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
