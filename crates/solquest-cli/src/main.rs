mod commands;
mod solana_utils;
mod types;

use clap::{Parser, Subcommand};
use colored::Colorize;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use std::str::FromStr;

#[derive(Parser, Debug)]
#[command(
    name = "solquest-cli",
    about = "SolQuest CLI: All-in-one Solana Developer Tool (PDA, Counter, SPL Tokens)",
    version = "0.1.0"
)]
struct Cli {
    /// Solana RPC URL (defaults to Devnet)
    #[arg(short, long, default_value = "https://api.devnet.solana.com")]
    rpc: String,

    /// SolQuest Program ID
    #[arg(short, long, default_value = "SQst111111111111111111111111111111111111111")]
    program_id: String,

    /// Path to user keypair JSON file
    #[arg(short, long, default_value = "~/.config/solana/id.json")]
    keypair: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Week 6: Inspect and calculate PDA address math and bump seed
    InspectPda {
        /// Public key of user authority to derive PDA for
        #[arg(short, long)]
        user: String,
    },

    /// Week 6: Read on-chain UserProfile state from PDA and deserialize using Borsh
    GetProfile {
        /// User authority public key
        #[arg(short, long)]
        user: String,
    },

    /// Week 6: Create decentralized on-chain profile using PDA
    InitProfile {
        /// User nickname (max 32 chars)
        #[arg(short, long)]
        username: String,
        /// User bio (max 128 chars)
        #[arg(short, long)]
        bio: String,
    },

    /// Week 5: Increment on-chain activity counter and gain XP / Level
    Increment,

    /// Week 7: Claim SPL reward tokens via CPI mint
    ClaimReward {
        /// SPL Token Mint address
        #[arg(short, long)]
        mint: String,
        /// Amount of tokens (base units) to claim
        #[arg(short, long)]
        amount: u64,
    },

    /// Week 7: Transfer SPL reward tokens to another wallet
    TransferReward {
        /// SPL Token Mint address
        #[arg(short, long)]
        mint: String,
        /// Recipient wallet public key
        #[arg(short, long)]
        recipient: String,
        /// Amount to transfer
        #[arg(short, long)]
        amount: u64,
    },

    /// Utility: Generate a fresh Solana keypair for devnet testing
    NewWallet,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let program_pubkey = Pubkey::from_str(&cli.program_id)
        .map_err(|e| anyhow::anyhow!("Invalid program ID: {}", e))?;

    match cli.command {
        Commands::InspectPda { user } => {
            let user_pubkey = Pubkey::from_str(&user)?;
            commands::inspect_pda(&cli.rpc, &program_pubkey, &user_pubkey)?;
        }
        Commands::GetProfile { user } => {
            let user_pubkey = Pubkey::from_str(&user)?;
            commands::get_profile(&cli.rpc, &program_pubkey, &user_pubkey)?;
        }
        Commands::InitProfile { username, bio } => {
            commands::init_profile(&cli.rpc, &program_pubkey, &cli.keypair, &username, &bio)?;
        }
        Commands::Increment => {
            commands::increment_counter(&cli.rpc, &program_pubkey, &cli.keypair)?;
        }
        Commands::ClaimReward { mint, amount } => {
            let mint_pubkey = Pubkey::from_str(&mint)?;
            commands::claim_reward(&cli.rpc, &program_pubkey, &cli.keypair, &mint_pubkey, amount)?;
        }
        Commands::TransferReward {
            mint,
            recipient,
            amount,
        } => {
            let mint_pubkey = Pubkey::from_str(&mint)?;
            let recipient_pubkey = Pubkey::from_str(&recipient)?;
            commands::transfer_reward(
                &cli.rpc,
                &program_pubkey,
                &cli.keypair,
                &mint_pubkey,
                &recipient_pubkey,
                amount,
            )?;
        }
        Commands::NewWallet => {
            let kp = Keypair::new();
            println!("{}", "=== New Solana Keypair Generated ===".cyan().bold());
            println!("Public Key: {}", kp.pubkey().to_string().green().bold());
            println!("Base58 Private Key: {}", kp.to_base58_string().yellow());
            println!("Save this keypair into a JSON file or use solana-keygen for CLI usage.");
        }
    }

    Ok(())
}
