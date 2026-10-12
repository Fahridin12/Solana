use anchor_lang::prelude::*;
use crate::state::{ProgramConfig, UserProfile};
use crate::errors::SolQuestError;

#[derive(Accounts)]
pub struct InitProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [UserProfile::SEED_PREFIX, authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [ProgramConfig::SEED_PREFIX],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitProfile>,
    username: String,
    bio: String,
) -> Result<()> {
    require!(!username.trim().is_empty() && username.len() <= 32, SolQuestError::InvalidUsernameLength);
    require!(bio.len() <= 128, SolQuestError::InvalidBioLength);

    let clock = Clock::get()?;
    let profile = &mut ctx.accounts.profile;
    profile.authority = ctx.accounts.authority.key();
    profile.username = username;
    profile.bio = bio;
    profile.counter = 0;
    profile.xp = 0;
    profile.level = 1;
    profile.tokens_claimed = 0;
    profile.created_at = clock.unix_timestamp;
    profile.last_active_at = clock.unix_timestamp;
    profile.bump = ctx.bumps.profile;

    // Track total user profiles registered in config
    let config = &mut ctx.accounts.config;
    config.total_profiles = config.total_profiles.checked_add(1).ok_or(SolQuestError::MathOverflow)?;

    msg!("User profile created for authority: {}, username: {}", profile.authority, profile.username);
    Ok(())
}
