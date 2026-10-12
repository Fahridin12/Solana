use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;

/// On-chain UserProfile state mirrored in pure Rust using Borsh (Week 3 & 6)
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq, Eq)]
pub struct UserProfileState {
    pub authority: Pubkey,
    pub username: String,
    pub bio: String,
    pub counter: u64,
    pub xp: u64,
    pub level: u16,
    pub tokens_claimed: u64,
    pub created_at: i64,
    pub last_active_at: i64,
    pub bump: u8,
}

/// Global Program Configuration mirrored in pure Rust using Borsh
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq, Eq)]
pub struct ProgramConfigState {
    pub admin: Pubkey,
    pub reward_mint: Pubkey,
    pub mint_bump: u8,
    pub bump: u8,
    pub reward_per_increment: u64,
    pub total_profiles: u64,
    pub total_increments: u64,
}

/// Instruction payload for InitProfile
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct InitProfileArgs {
    pub username: String,
    pub bio: String,
}

/// Instruction payload for ClaimReward
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ClaimRewardArgs {
    pub amount: u64,
}

/// Instruction payload for TransferReward
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TransferRewardArgs {
    pub amount: u64,
}
