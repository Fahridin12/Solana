use anyhow::{Context, Result};
use borsh::{BorshDeserialize, BorshSerialize};
use colored::Colorize;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;

use crate::solana_utils::{
    create_rpc_client, derive_config_pda, derive_mint_authority_pda, derive_profile_pda,
    get_anchor_discriminator, load_keypair,
};
use crate::types::{ClaimRewardArgs, InitProfileArgs, TransferRewardArgs, UserProfileState};

/// Command: Inspect and calculate PDA math for a given user authority
pub fn inspect_pda(rpc_url: &str, program_id: &Pubkey, user_pubkey: &Pubkey) -> Result<()> {
    println!("{}", "=== PDA Inspector (Week 6: PDA Architecture) ===".cyan().bold());
    println!("Program ID:       {}", program_id.to_string().yellow());
    println!("User Authority:   {}", user_pubkey.to_string().green());

    let (pda, bump) = derive_profile_pda(program_id, user_pubkey);
    println!("Derived PDA:      {}", pda.to_string().bright_magenta().bold());
    println!("Canonical Bump:   {}", bump.to_string().yellow());

    let rpc = create_rpc_client(rpc_url);
    match rpc.get_account(&pda) {
        Ok(account) => {
            println!("\nAccount Status:   {}", "EXISTS ON-CHAIN".green().bold());
            println!("Lamports Balance: {} lamports ({} SOL)", account.lamports, account.lamports as f64 / 1e9);
            println!("Data Length:      {} bytes", account.data.len());
            println!("Owner Program:    {}", account.owner);
        }
        Err(_) => {
            println!("\nAccount Status:   {}", "NOT INITIALIZED YET".yellow());
            let rent = rpc.get_minimum_balance_for_rent_exemption(256)?;
            println!("Rent Exemption:   ~{} lamports needed to initialize", rent);
        }
    }

    Ok(())
}

/// Command: Query and deserialize UserProfile on-chain data using Borsh
pub fn get_profile(rpc_url: &str, program_id: &Pubkey, user_pubkey: &Pubkey) -> Result<()> {
    println!("{}", "=== Fetching On-Chain User Profile ===".cyan().bold());
    let (pda, _) = derive_profile_pda(program_id, user_pubkey);
    let rpc = create_rpc_client(rpc_url);

    let account_data = rpc.get_account_data(&pda)
        .context(format!("Failed to retrieve account data for PDA {}", pda))?;

    if account_data.len() < 8 {
        anyhow::bail!("Account data too short for Anchor discriminator");
    }

    // Skip the first 8 bytes (Anchor account discriminator) and deserialize with Borsh
    let profile = UserProfileState::try_from_slice(&account_data[8..])
        .context("Failed to deserialize UserProfileState using Borsh")?;

    println!("PDA Address:      {}", pda.to_string().bright_magenta());
    println!("Authority:        {}", profile.authority.to_string().green());
    println!("Username:         {}", profile.username.bold());
    println!("Bio:              {}", profile.bio);
    println!("Counter:          {}", profile.counter.to_string().yellow().bold());
    println!("XP:               {}", profile.xp.to_string().cyan());
    println!("Level:            {}", profile.level.to_string().bright_green().bold());
    println!("Tokens Claimed:   {}", profile.tokens_claimed);
    println!("Created At:       {}", profile.created_at);
    println!("Last Active At:   {}", profile.last_active_at);

    Ok(())
}

/// Command: Initialize decentralized on-chain user profile (Week 6)
pub fn init_profile(
    rpc_url: &str,
    program_id: &Pubkey,
    keypair_path: &str,
    username: &str,
    bio: &str,
) -> Result<()> {
    println!("{}", "=== Initializing Decentralized User Profile ===".cyan().bold());
    let payer = load_keypair(keypair_path)?;
    let (profile_pda, _) = derive_profile_pda(program_id, &payer.pubkey());
    let (config_pda, _) = derive_config_pda(program_id);

    let mut ix_data = Vec::new();
    ix_data.extend_from_slice(&get_anchor_discriminator("init_profile"));
    let args = InitProfileArgs {
        username: username.to_string(),
        bio: bio.to_string(),
    };
    args.serialize(&mut ix_data)?;

    let accounts = vec![
        AccountMeta::new(profile_pda, false),
        AccountMeta::new(config_pda, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    let instruction = Instruction {
        program_id: *program_id,
        accounts,
        data: ix_data,
    };

    send_and_confirm_tx(rpc_url, &payer, instruction, "Profile Initialization")?;
    println!("Profile PDA: {}", profile_pda.to_string().bright_magenta());
    Ok(())
}

/// Command: Increment counter on-chain (Week 5: Counter Program)
pub fn increment_counter(
    rpc_url: &str,
    program_id: &Pubkey,
    keypair_path: &str,
) -> Result<()> {
    println!("{}", "=== Incrementing Activity Counter ===".cyan().bold());
    let payer = load_keypair(keypair_path)?;
    let (profile_pda, _) = derive_profile_pda(program_id, &payer.pubkey());
    let (config_pda, _) = derive_config_pda(program_id);

    let mut ix_data = Vec::new();
    ix_data.extend_from_slice(&get_anchor_discriminator("increment_counter"));

    let accounts = vec![
        AccountMeta::new(profile_pda, false),
        AccountMeta::new(config_pda, false),
        AccountMeta::new_readonly(payer.pubkey(), true),
    ];

    let instruction = Instruction {
        program_id: *program_id,
        accounts,
        data: ix_data,
    };

    send_and_confirm_tx(rpc_url, &payer, instruction, "Counter Increment")?;
    Ok(())
}

/// Command: Claim reward SPL tokens via CPI mint (Week 7: SPL Tokens)
pub fn claim_reward(
    rpc_url: &str,
    program_id: &Pubkey,
    keypair_path: &str,
    reward_mint: &Pubkey,
    amount: u64,
) -> Result<()> {
    println!("{}", "=== Claiming SPL Reward Tokens ===".cyan().bold());
    let payer = load_keypair(keypair_path)?;
    let (profile_pda, _) = derive_profile_pda(program_id, &payer.pubkey());
    let (config_pda, _) = derive_config_pda(program_id);
    let (mint_auth_pda, _) = derive_mint_authority_pda(program_id);
    let user_ata = get_associated_token_address(&payer.pubkey(), reward_mint);

    let mut ix_data = Vec::new();
    ix_data.extend_from_slice(&get_anchor_discriminator("claim_reward"));
    let args = ClaimRewardArgs { amount };
    args.serialize(&mut ix_data)?;

    let accounts = vec![
        AccountMeta::new(profile_pda, false),
        AccountMeta::new_readonly(config_pda, false),
        AccountMeta::new(*reward_mint, false),
        AccountMeta::new_readonly(mint_auth_pda, false),
        AccountMeta::new(user_ata, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(spl_token::ID, false),
    ];

    let instruction = Instruction {
        program_id: *program_id,
        accounts,
        data: ix_data,
    };

    send_and_confirm_tx(rpc_url, &payer, instruction, "Claim Rewards")?;
    println!("Recipient ATA: {}", user_ata.to_string().bright_magenta());
    Ok(())
}

/// Command: Transfer SPL reward tokens to another recipient (Week 7: Token Transfer)
pub fn transfer_reward(
    rpc_url: &str,
    program_id: &Pubkey,
    keypair_path: &str,
    reward_mint: &Pubkey,
    recipient_pubkey: &Pubkey,
    amount: u64,
) -> Result<()> {
    println!("{}", "=== Transferring SPL Reward Tokens ===".cyan().bold());
    let payer = load_keypair(keypair_path)?;
    let source_ata = get_associated_token_address(&payer.pubkey(), reward_mint);
    let dest_ata = get_associated_token_address(recipient_pubkey, reward_mint);

    let mut ix_data = Vec::new();
    ix_data.extend_from_slice(&get_anchor_discriminator("transfer_reward"));
    let args = TransferRewardArgs { amount };
    args.serialize(&mut ix_data)?;

    let accounts = vec![
        AccountMeta::new(source_ata, false),
        AccountMeta::new(dest_ata, false),
        AccountMeta::new_readonly(payer.pubkey(), true),
        AccountMeta::new_readonly(spl_token::ID, false),
    ];

    let instruction = Instruction {
        program_id: *program_id,
        accounts,
        data: ix_data,
    };

    send_and_confirm_tx(rpc_url, &payer, instruction, "Transfer Tokens")?;
    Ok(())
}

/// Helper to build, sign, and broadcast a transaction with confirmation
fn send_and_confirm_tx(
    rpc_url: &str,
    payer: &Keypair,
    instruction: Instruction,
    action_label: &str,
) -> Result<String> {
    let rpc = create_rpc_client(rpc_url);
    let recent_blockhash = rpc.get_latest_blockhash()
        .context("Failed getting latest blockhash from RPC")?;

    let message = Message::new(&[instruction], Some(&payer.pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.sign(&[payer], recent_blockhash);

    println!("Broadcasting transaction to Solana Devnet...");
    let signature = rpc.send_and_confirm_transaction(&tx)
        .context(format!("Failed executing {}", action_label))?;

    println!("{} successful!", action_label.green().bold());
    println!("Signature:  {}", signature.to_string().bright_yellow().bold());
    println!("Explorer:   https://explorer.solana.com/tx/{}?cluster=devnet", signature);

    Ok(signature.to_string())
}
