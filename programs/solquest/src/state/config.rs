use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct ProgramConfig {
    /// Super-admin authority for protocol maintenance
    pub admin: Pubkey,
    /// SPL Token Mint used for rewards (Week 7: SPL Tokens)
    pub reward_mint: Pubkey,
    /// PDA bump for the mint authority
    pub mint_bump: u8,
    /// Bump for this config account
    pub bump: u8,
    /// Default reward amount (in token base units) per counter increment
    pub reward_per_increment: u64,
    /// Total decentralized profiles created in SolQuest
    pub total_profiles: u64,
    /// Total counter increments across all users
    pub total_increments: u64,
}

impl ProgramConfig {
    pub const SEED_PREFIX: &'static [u8] = b"solquest-config";
    pub const MINT_AUTHORITY_SEED: &'static [u8] = b"mint-authority";
}
