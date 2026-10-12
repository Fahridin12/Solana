import React from "react";
import { Terminal, Database, Key, ShieldCheck } from "lucide-react";

interface PdaExplorerProps {
  programId: string;
  walletPubkey: string | null;
  pdaAddress: string | null;
  bump: number | null;
}

export const PdaExplorer: React.FC<PdaExplorerProps> = ({
  programId,
  walletPubkey,
  pdaAddress,
  bump,
}) => {
  return (
    <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 mt-6">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="w-5 h-5 text-[#14F195]" />
        <h3 className="font-bold text-lg text-white">
          Week 6 Architecture: PDA & Account Math Deep-Dive
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-[#0c0d14] border border-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold mb-2">
            <Key className="w-4 h-4 text-[#9945FF]" />
            <span>1. Seeds Derivation</span>
          </div>
          <p className="text-slate-300 font-sans mb-2">
            Seeds hashed into SHA-256 curve search:
          </p>
          <div className="bg-black/50 p-2 rounded text-[11px] space-y-1 text-slate-400">
            <div>Prefix: <span className="text-[#14F195]">"user-profile"</span></div>
            <div className="truncate">Wallet: <span className="text-white">{walletPubkey || "Not connected"}</span></div>
          </div>
        </div>

        <div className="bg-[#0c0d14] border border-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-[#14F195]" />
            <span>2. Canonical Bump</span>
          </div>
          <p className="text-slate-300 font-sans mb-2">
            First nonce off the ed25519 curve (no private key):
          </p>
          <div className="bg-black/50 p-2 rounded text-[11px] space-y-1 text-slate-400">
            <div>Bump Nonce: <span className="text-yellow-400 font-bold">{bump !== null ? bump : "N/A"}</span></div>
            <div>Signer Type: <span className="text-[#9945FF]">Program Derived</span></div>
          </div>
        </div>

        <div className="bg-[#0c0d14] border border-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold mb-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>3. Account Storage (Borsh)</span>
          </div>
          <p className="text-slate-300 font-sans mb-2">
            Anchor serialized on-chain memory layout:
          </p>
          <div className="bg-black/50 p-2 rounded text-[11px] space-y-1 text-slate-400">
            <div>Discriminator: <span className="text-sky-300">8 bytes</span></div>
            <div>Payload Size: <span className="text-sky-300">~240 bytes</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <span className="text-slate-400">Derived PDA Target:</span>
        <span className="font-mono text-[#14F195] font-bold break-all">
          {pdaAddress || "Connect wallet to compute PDA"}
        </span>
      </div>
    </div>
  );
};
