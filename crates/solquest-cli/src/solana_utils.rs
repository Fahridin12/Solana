use anyhow::{Context, Result};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair},
};
use std::path::Path;

pub const DEFAULT_DEVNET_RPC: &str = "https://api.devnet.solana.com";
pub const PROFILE_SEED: &[u8] = b"user-profile";
pub const CONFIG_SEED: &[u8] = b"solquest-config";
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint-authority";

/// Compute Anchor 8-byte instruction discriminator: sha256("global:<name>")[..8]
pub fn get_anchor_discriminator(instruction_name: &str) -> [u8; 8] {
    use solana_sdk::hash::hash;
    let preimage = format!("global:{}", instruction_name);
    let hash_result = hash(preimage.as_bytes());
    let mut disc = [0u8; 8];
    disc.copy_from_slice(&hash_result.to_bytes()[..8]);
    disc
}

/// Derive UserProfile PDA address and canonical bump
pub fn derive_profile_pda(program_id: &Pubkey, authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[PROFILE_SEED, authority.as_ref()], program_id)
}

/// Derive SolQuest Config PDA address and canonical bump
pub fn derive_config_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CONFIG_SEED], program_id)
}

/// Derive Mint Authority PDA address and canonical bump
pub fn derive_mint_authority_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[MINT_AUTHORITY_SEED], program_id)
}

/// Load keypair from file path (supports `~` expansion)
pub fn load_keypair(path_str: &str) -> Result<Keypair> {
    let expanded = shellexpand::tilde(path_str).to_string();
    let path = Path::new(&expanded);
    if !path.exists() {
        anyhow::bail!("Keypair file not found at: {}", expanded);
    }
    read_keypair_file(path).map_err(|e| anyhow::anyhow!("Failed reading keypair: {}", e))
}

/// Create configured Solana RPC client
pub fn create_rpc_client(rpc_url: &str) -> RpcClient {
    RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed())
}
