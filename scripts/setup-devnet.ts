import * as anchor from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Metaplex / Token Metadata standard instructions
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

const SOLQUEST_PROGRAM_ID = new PublicKey("SQst111111111111111111111111111111111111111");

async function main() {
  console.log("=================================================");
  console.log("   SolQuest Devnet Initializer & Token Setup    ");
  console.log("=================================================");

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Load or generate deployer keypair
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const keypairPath = path.join(homeDir, ".config", "solana", "id.json");
  
  let payer: Keypair;
  if (fs.existsSync(keypairPath)) {
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
    payer = Keypair.fromSecretKey(secretKey);
    console.log("Loaded existing keypair from:", keypairPath);
  } else {
    payer = Keypair.generate();
    console.log("Generated new deployer keypair:", payer.publicKey.toBase58());
  }

  console.log("Payer / Admin Pubkey:", payer.publicKey.toBase58());

  // Check SOL balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < LAMPORTS_PER_SOL) {
    console.log("Requesting 1 SOL Devnet Airdrop...");
    try {
      const sig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
      console.log("Airdrop confirmed! Tx:", sig);
    } catch (e) {
      console.warn("Airdrop rate limit reached. Proceeding with available funds or use faucet.");
    }
  }

  // Derive PDAs
  const [mintAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint-authority")],
    SOLQUEST_PROGRAM_ID
  );
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("solquest-config")],
    SOLQUEST_PROGRAM_ID
  );

  console.log("\nDerived Addresses:");
  console.log("- Mint Authority PDA:", mintAuthorityPda.toBase58());
  console.log("- Config PDA:        ", configPda.toBase58());

  // Create SPL Token Mint with Mint Authority set to PDA
  console.log("\nCreating SPL Reward Token Mint on Devnet (Week 7)...");
  const rewardMint = await createMint(
    connection,
    payer,
    mintAuthorityPda, // PDA holds minting rights
    null,
    6
  );
  console.log("SPL Reward Mint created:", rewardMint.toBase58());

  // Derive Metaplex Metadata PDA
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      rewardMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  console.log("Metaplex Metadata PDA:", metadataPda.toBase58());

  // Save configuration artifact for Frontend & CLI
  const configOutput = {
    network: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    programId: SOLQUEST_PROGRAM_ID.toBase58(),
    rewardMint: rewardMint.toBase58(),
    mintAuthorityPda: mintAuthorityPda.toBase58(),
    configPda: configPda.toBase58(),
    metadataPda: metadataPda.toBase58(),
    tokenInfo: {
      name: "SolQuest Reward Token",
      symbol: "QUEST",
      decimals: 6,
      uri: "https://raw.githubusercontent.com/solquest/metadata/main/token.json"
    },
    updatedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "..", "deploy-config.json");
  fs.writeFileSync(outputPath, JSON.stringify(configOutput, null, 2));
  console.log(`\nDeployment metadata saved to: ${outputPath}`);

  // Copy to app/src/config.json for frontend
  const appConfigPath = path.join(__dirname, "..", "app", "src", "config.json");
  if (fs.existsSync(path.dirname(appConfigPath))) {
    fs.writeFileSync(appConfigPath, JSON.stringify(configOutput, null, 2));
  }

  console.log("\nDevnet Setup Completed Successfully!");
}

main().catch((err) => {
  console.error("Error running devnet setup:", err);
  process.exit(1);
});
