use anchor_lang::prelude::*;
use crate::state::{ProgramConfig, UserProfile};
use crate::errors::SolQuestError;

#[derive(Accounts)]
pub struct IncrementCounter<'info> {
    #[account(
        mut,
        seeds = [UserProfile::SEED_PREFIX, authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority @ SolQuestError::Unauthorized
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [ProgramConfig::SEED_PREFIX],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,

    pub authority: Signer<'info>,
}

#[event]
pub struct CounterIncremented {
    pub authority: Pubkey,
    pub new_counter: u64,
    pub xp: u64,
    pub level: u16,
    pub timestamp: i64,
}

pub fn handler(ctx: Context<IncrementCounter>) -> Result<()> {
    let clock = Clock::get()?;
    let profile = &mut ctx.accounts.profile;
    
    profile.increment(clock.unix_timestamp);

    let config = &mut ctx.accounts.config;
    config.total_increments = config.total_increments.checked_add(1).ok_or(SolQuestError::CounterOverflow)?;

    emit!(CounterIncremented {
        authority: profile.authority,
        new_counter: profile.counter,
        xp: profile.xp,
        level: profile.level,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Counter incremented! User: {}, Counter: {}, XP: {}, Level: {}",
        profile.authority,
        profile.counter,
        profile.xp,
        profile.level
    );

    Ok(())
}
