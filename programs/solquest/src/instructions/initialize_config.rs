use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::ProgramConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [ProgramConfig::SEED_PREFIX],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    /// The SPL token mint created for quest rewards
    pub reward_mint: Account<'info, Mint>,

    /// PDA that owns mint authority for the reward token
    /// CHECK: Validated via seeds
    #[account(
        seeds = [ProgramConfig::MINT_AUTHORITY_SEED],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, reward_per_increment: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.reward_mint = ctx.accounts.reward_mint.key();
    config.mint_bump = ctx.bumps.mint_authority;
    config.bump = ctx.bumps.config;
    config.reward_per_increment = reward_per_increment;
    config.total_profiles = 0;
    config.total_increments = 0;

    msg!("SolQuest Config initialized. Reward per increment: {}", reward_per_increment);
    Ok(())
}
