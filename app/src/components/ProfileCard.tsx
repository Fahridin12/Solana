import React, { useState } from "react";
import { User, Award, Shield, PlusCircle, ExternalLink, RefreshCw } from "lucide-react";

interface ProfileData {
  authority: string;
  username: string;
  bio: string;
  counter: number;
  xp: number;
  level: number;
  tokensClaimed: number;
  bump: number;
}

interface ProfileCardProps {
  profile: ProfileData | null;
  pdaAddress: string | null;
  loading: boolean;
  onCreateProfile: (username: string, bio: string) => Promise<void>;
  onRefresh: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  pdaAddress,
  loading,
  onCreateProfile,
  onRefresh,
}) => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      setIsSubmitting(true);
      await onCreateProfile(username, bio);
      setUsername("");
      setBio("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="h-20 bg-white/5 rounded-xl mb-4"></div>
        <div className="h-10 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9945FF]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#9945FF]" />
            <h3 className="font-bold text-lg text-white">Week 6: On-Chain PDA Profile</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Unregistered
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-5">
          Your wallet does not have a decentralized profile yet. Create an account PDA derived from seeds: <code className="bg-black/40 px-1.5 py-0.5 rounded text-[#14F195] text-xs">["user-profile", wallet_pubkey]</code>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Username (Max 32 chars)
            </label>
            <input
              type="text"
              required
              maxLength={32}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Satoshi_Dev"
              className="w-full bg-[#0c0d14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#9945FF] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Bio / Tagline (Max 128 chars)
            </label>
            <input
              type="text"
              maxLength={128}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Building on Solana Devnet"
              className="w-full bg-[#0c0d14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#9945FF] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-extrabold text-sm py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>Initialize On-Chain Profile</span>
          </button>
        </form>
      </div>
    );
  }

  const nextLevelXp = profile.level * 500;
  const currentProgress = (profile.xp % 500) / 5;

  return (
    <div className="bg-[#151722] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#14F195]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-0.5">
            <div className="w-full h-full bg-[#12131c] rounded-[14px] flex items-center justify-center font-bold text-lg text-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-xl text-white">{profile.username}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 font-bold">
                Level {profile.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{profile.bio || "Solana Adventurer"}</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          title="Refresh Profile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Experience Bar */}
      <div className="mb-5 bg-black/30 p-3 rounded-xl border border-white/5">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-400 flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-[#14F195]" />
            <span>XP Progress</span>
          </span>
          <span className="font-mono text-[#14F195]">
            {profile.xp} / {nextLevelXp} XP
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#9945FF] to-[#14F195] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, currentProgress)}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <span className="text-slate-400 block mb-1">Activity Counter</span>
          <span className="text-lg font-bold text-white font-mono">{profile.counter}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <span className="text-slate-400 block mb-1">Tokens Claimed</span>
          <span className="text-lg font-bold text-[#14F195] font-mono">
            {(profile.tokensClaimed / 1e6).toFixed(2)} QUEST
          </span>
        </div>
      </div>

      {pdaAddress && (
        <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/10 text-slate-400">
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-[#9945FF]" />
            <span>PDA Bump: <code className="text-white font-bold">{profile.bump}</code></span>
          </span>
          <a
            href={`https://explorer.solana.com/address/${pdaAddress}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-[#14F195] hover:underline"
          >
            <span>View PDA on Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
