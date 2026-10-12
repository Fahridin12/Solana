use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("SQst111111111111111111111111111111111111111");

#[program]
pub mod solquest {
    use super::*;

    /// Initialize the protocol config and mint authority PDA
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        reward_per_increment: u64,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, reward_per_increment)
    }

    /// Week 6: Create decentralized on-chain user profile with PDA seeds
    pub fn init_profile(
        ctx: Context<InitProfile>,
        username: String,
        bio: String,
    ) -> Result<()> {
        instructions::init_profile::handler(ctx, username, bio)
    }

    /// Week 5: Counter Program - increment on-chain counter, compute XP & Level
    pub fn increment_counter(ctx: Context<IncrementCounter>) -> Result<()> {
        instructions::increment_counter::handler(ctx)
    }

    /// Week 7: SPL Tokens - Mint reward tokens via CPI with PDA authority
    pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {
        instructions::claim_reward::handler(ctx, amount)
    }

    /// Week 7: SPL Tokens - Transfer reward tokens to another account via CPI
    pub fn transfer_reward(ctx: Context<TransferReward>, amount: u64) -> Result<()> {
        instructions::transfer_reward::handler(ctx, amount)
    }
}
