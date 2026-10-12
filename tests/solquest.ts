import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("SolQuest Unified Test Suite (Weeks 4-7)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // SolQuest Program interface
  const program = anchor.workspace.Solquest as Program<any>;
  const admin = (provider.wallet as any).payer as Keypair;

  const alice = Keypair.generate();
  const bob = Keypair.generate();

  let rewardMint: PublicKey;
  let mintAuthorityPda: PublicKey;
  let configPda: PublicKey;
  let aliceProfilePda: PublicKey;
  let aliceTokenAccount: PublicKey;
  let bobTokenAccount: PublicKey;

  const REWARD_PER_INCREMENT = new anchor.BN(10 * 10 ** 6); // 10 tokens (with 6 decimals)

  before(async () => {
    // Airdrop SOL to test users Alice and Bob
    const airdropAlice = await provider.connection.requestAirdrop(alice.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const airdropBob = await provider.connection.requestAirdrop(bob.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropAlice);
    await provider.connection.confirmTransaction(airdropBob);

    // Derive PDA addresses
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("solquest-config")],
      program.programId
    );

    [mintAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      program.programId
    );

    [aliceProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), alice.publicKey.toBuffer()],
      program.programId
    );

    // Create the SPL Token Mint where mint authority is the PDA! (Week 7)
    rewardMint = await createMint(
      provider.connection,
      admin,
      mintAuthorityPda, // PDA holds mint authority
      null,             // Freeze authority
      6                 // 6 decimals
    );

    console.log("Reward Mint created at:", rewardMint.toBase58());
    console.log("Mint Authority PDA:", mintAuthorityPda.toBase58());
  });

  it("Step 1 (Week 4 & Config): Initializes SolQuest protocol config", async () => {
    await program.methods
      .initializeConfig(REWARD_PER_INCREMENT)
      .accounts({
        config: configPda,
        rewardMint: rewardMint,
        mintAuthority: mintAuthorityPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const configAccount = await program.account.programConfig.fetch(configPda);
    expect(configAccount.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(configAccount.rewardMint.toBase58()).to.equal(rewardMint.toBase58());
    expect(configAccount.totalProfiles.toNumber()).to.equal(0);
    expect(configAccount.totalIncrements.toNumber()).to.equal(0);
  });

  it("Step 2 (Week 6: PDA Profile): Initializes Alice's on-chain profile using PDA", async () => {
    const username = "Alice_Builder";
    const bio = "Solana Web3 Developer & Quest Explorer";

    await program.methods
      .initProfile(username, bio)
      .accounts({
        profile: aliceProfilePda,
        config: configPda,
        authority: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    const profile = await program.account.userProfile.fetch(aliceProfilePda);
    expect(profile.authority.toBase58()).to.equal(alice.publicKey.toBase58());
    expect(profile.username).to.equal(username);
    expect(profile.bio).to.equal(bio);
    expect(profile.counter.toNumber()).to.equal(0);
    expect(profile.xp.toNumber()).to.equal(0);
    expect(profile.level).to.equal(1);
    expect(profile.tokensClaimed.toNumber()).to.equal(0);

    const config = await program.account.programConfig.fetch(configPda);
    expect(config.totalProfiles.toNumber()).to.equal(1);
  });

  it("Step 3 (Week 5: Counter Program): Increments Alice's activity counter and awards XP", async () => {
    // First increment
    await program.methods
      .incrementCounter()
      .accounts({
        profile: aliceProfilePda,
        config: configPda,
        authority: alice.publicKey,
      })
      .signers([alice])
      .rpc();

    let profile = await program.account.userProfile.fetch(aliceProfilePda);
    expect(profile.counter.toNumber()).to.equal(1);
    expect(profile.xp.toNumber()).to.equal(100);

    // Second increment
    await program.methods
      .incrementCounter()
      .accounts({
        profile: aliceProfilePda,
        config: configPda,
        authority: alice.publicKey,
      })
      .signers([alice])
      .rpc();

    profile = await program.account.userProfile.fetch(aliceProfilePda);
    expect(profile.counter.toNumber()).to.equal(2);
    expect(profile.xp.toNumber()).to.equal(200);

    const config = await program.account.programConfig.fetch(configPda);
    expect(config.totalIncrements.toNumber()).to.equal(2);
  });

  it("Step 4 (Week 7: SPL Tokens CPI Mint): Alice claims SPL token reward via CPI", async () => {
    // Create Alice's Associated Token Account
    const aliceAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      alice,
      rewardMint,
      alice.publicKey
    );
    aliceTokenAccount = aliceAta.address;

    // Alice has counter=2, reward_per_increment = 10 tokens. Max claimable = 20 tokens.
    const claimAmount = new anchor.BN(15 * 10 ** 6); // Claim 15 tokens

    await program.methods
      .claimReward(claimAmount)
      .accounts({
        profile: aliceProfilePda,
        config: configPda,
        rewardMint: rewardMint,
        mintAuthority: mintAuthorityPda,
        userTokenAccount: aliceTokenAccount,
        authority: alice.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc();

    const tokenBal = await getAccount(provider.connection, aliceTokenAccount);
    expect(Number(tokenBal.amount)).to.equal(15 * 10 ** 6);

    const profile = await program.account.userProfile.fetch(aliceProfilePda);
    expect(profile.tokensClaimed.toNumber()).to.equal(15 * 10 ** 6);
  });

  it("Step 5 (Week 7: SPL Token Transfer): Alice transfers SPL reward tokens to Bob", async () => {
    const bobAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bob,
      rewardMint,
      bob.publicKey
    );
    bobTokenAccount = bobAta.address;

    const transferAmount = new anchor.BN(5 * 10 ** 6); // 5 tokens

    await program.methods
      .transferReward(transferAmount)
      .accounts({
        from: aliceTokenAccount,
        to: bobTokenAccount,
        authority: alice.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc();

    const aliceBal = await getAccount(provider.connection, aliceTokenAccount);
    const bobBal = await getAccount(provider.connection, bobTokenAccount);

    expect(Number(aliceBal.amount)).to.equal(10 * 10 ** 6); // 15 - 5 = 10
    expect(Number(bobBal.amount)).to.equal(5 * 10 ** 6);   // 0 + 5 = 5
  });
});
