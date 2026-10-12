import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import idl from "../idl/solquest.json";
import appConfig from "../config.json";

export interface ProfileData {
  authority: string;
  username: string;
  bio: string;
  counter: number;
  xp: number;
  level: number;
  tokensClaimed: number;
  bump: number;
}

export function useSolQuest() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pdaAddress, setPdaAddress] = useState<string | null>(null);
  const [pdaBump, setPdaBump] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [claimableRewards, setClaimableRewards] = useState<number>(0);

  const programId = new PublicKey(appConfig.programId);
  const rewardMint = new PublicKey(appConfig.rewardMint);

  // Derive PDAs
  const getProfilePda = useCallback(
    (authority: PublicKey) => {
      return PublicKey.findProgramAddressSync(
        [Buffer.from("user-profile"), authority.toBuffer()],
        programId
      );
    },
    [programId]
  );

  const getConfigPda = useCallback(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("solquest-config")],
      programId
    );
  }, [programId]);

  const getMintAuthorityPda = useCallback(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      programId
    );
  }, [programId]);

  const getProvider = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    return new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );
  }, [connection, wallet]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(idl as Idl, programId, provider);
  }, [getProvider, programId]);

  // Fetch all user on-chain data
  const fetchData = useCallback(async () => {
    if (!wallet.publicKey) {
      setSolBalance(null);
      setProfile(null);
      setPdaAddress(null);
      setPdaBump(null);
      setTokenBalance(0);
      setClaimableRewards(0);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch SOL balance
      const lamports = await connection.getBalance(wallet.publicKey);
      setSolBalance(lamports / LAMPORTS_PER_SOL);

      // 2. Fetch User Profile PDA
      const [profilePda, bump] = getProfilePda(wallet.publicKey);
      setPdaAddress(profilePda.toBase58());
      setPdaBump(bump);

      const program = getProgram();
      if (program) {
        try {
          const profileAcc: any = await program.account.userProfile.fetch(profilePda);
          if (profileAcc) {
            const counter = profileAcc.counter ? profileAcc.counter.toNumber() : 0;
            const xp = profileAcc.xp ? profileAcc.xp.toNumber() : 0;
            const level = profileAcc.level || 1;
            const claimed = profileAcc.tokensClaimed ? profileAcc.tokensClaimed.toNumber() : 0;

            setProfile({
              authority: profileAcc.authority.toBase58(),
              username: profileAcc.username,
              bio: profileAcc.bio,
              counter,
              xp,
              level,
              tokensClaimed: claimed,
              bump: profileAcc.bump,
            });

            // Calculate claimable tokens: (counter * 10) - claimed
            const totalEarned = counter * 10;
            const claimedTokens = claimed / 1e6;
            setClaimableRewards(Math.max(0, totalEarned - claimedTokens));
          }
        } catch {
          // Profile account does not exist yet
          setProfile(null);
          setClaimableRewards(0);
        }
      }

      // 3. Fetch SPL Token Account Balance
      const userAta = getAssociatedTokenAddressSync(rewardMint, wallet.publicKey);
      try {
        const tokenAcc = await getAccount(connection, userAta);
        setTokenBalance(Number(tokenAcc.amount) / 1e6);
      } catch {
        setTokenBalance(0);
      }
    } catch (e) {
      console.error("Error fetching SolQuest data:", e);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection, getProfilePda, getProgram, rewardMint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize Profile (Week 6)
  const createProfile = async (username: string, bio: string) => {
    const program = getProgram();
    if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

    const [profilePda] = getProfilePda(wallet.publicKey);
    const [configPda] = getConfigPda();

    const tx = await program.methods
      .initProfile(username, bio)
      .accounts({
        profile: profilePda,
        config: configPda,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(tx, "confirmed");
    await fetchData();
    return tx;
  };

  // Increment Counter (Week 5)
  const incrementCounter = async () => {
    const program = getProgram();
    if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

    const [profilePda] = getProfilePda(wallet.publicKey);
    const [configPda] = getConfigPda();

    const tx = await program.methods
      .incrementCounter()
      .accounts({
        profile: profilePda,
        config: configPda,
        authority: wallet.publicKey,
      })
      .rpc();

    await connection.confirmTransaction(tx, "confirmed");
    await fetchData();
    return tx;
  };

  // Claim SPL Rewards via CPI Mint (Week 7)
  const claimRewards = async (amountTokens: number) => {
    const program = getProgram();
    if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

    const [profilePda] = getProfilePda(wallet.publicKey);
    const [configPda] = getConfigPda();
    const [mintAuthPda] = getMintAuthorityPda();
    const userAta = getAssociatedTokenAddressSync(rewardMint, wallet.publicKey);

    const baseAmount = new BN(Math.floor(amountTokens * 1e6));

    const tx = await program.methods
      .claimReward(baseAmount)
      .accounts({
        profile: profilePda,
        config: configPda,
        rewardMint: rewardMint,
        mintAuthority: mintAuthPda,
        userTokenAccount: userAta,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await connection.confirmTransaction(tx, "confirmed");
    await fetchData();
    return tx;
  };

  // Transfer SPL Tokens (Week 7)
  const transferRewards = async (recipientAddress: string, amountTokens: number) => {
    const program = getProgram();
    if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

    const recipientPubkey = new PublicKey(recipientAddress);
    const fromAta = getAssociatedTokenAddressSync(rewardMint, wallet.publicKey);
    const toAta = getAssociatedTokenAddressSync(rewardMint, recipientPubkey);

    const baseAmount = new BN(Math.floor(amountTokens * 1e6));

    const tx = await program.methods
      .transferReward(baseAmount)
      .accounts({
        from: fromAta,
        to: toAta,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await connection.confirmTransaction(tx, "confirmed");
    await fetchData();
    return tx;
  };

  return {
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
    refetch: fetchData,
    programId: programId.toBase58(),
    rewardMint: rewardMint.toBase58(),
  };
}
