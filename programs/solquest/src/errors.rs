use anchor_lang::prelude::*;

#[error_code]
pub enum SolQuestError {
    #[msg("Username cannot exceed 32 characters or be empty")]
    InvalidUsernameLength,

    #[msg("Bio cannot exceed 128 characters")]
    InvalidBioLength,

    #[msg("Counter reached maximum limit or overflowed")]
    CounterOverflow,

    #[msg("User is not authorized to perform this operation")]
    Unauthorized,

    #[msg("Reward amount exceeds allowed threshold")]
    InvalidRewardAmount,

    #[msg("Numerical overflow occurred in calculations")]
    MathOverflow,

    #[msg("Profile is not eligible for reward claim")]
    RewardNotEligible,
}
