use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use crate::state::{ProgramConfig, UserProfile};
use crate::errors::SolQuestError;

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [UserProfile::SEED_PREFIX, authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority @ SolQuestError::Unauthorized
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(
        seeds = [ProgramConfig::SEED_PREFIX],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        address = config.reward_mint
    )]
    pub reward_mint: Account<'info, Mint>,

    /// CHECK: PDA mint authority validated with seeds
    #[account(
        seeds = [ProgramConfig::MINT_AUTHORITY_SEED],
        bump = config.mint_bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == authority.key(),
        constraint = user_token_account.mint == reward_mint.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct RewardClaimed {
    pub recipient: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
}

pub fn handler(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    let config = &ctx.accounts.config;

    // Must have at least 1 counter increment
    require!(profile.counter > 0, SolQuestError::RewardNotEligible);

    // Validate claim amount
    let max_eligible = profile.counter.saturating_mul(config.reward_per_increment);
    let claimable = max_eligible.saturating_sub(profile.tokens_claimed);
    require!(amount > 0 && amount <= claimable, SolQuestError::InvalidRewardAmount);

    let seeds = &[
        ProgramConfig::MINT_AUTHORITY_SEED,
        &[config.mint_bump],
    ];
    let signer = &[&seeds[..]];

    // Execute CPI to SPL Token program to mint reward tokens to user's ATA
    let cpi_accounts = MintTo {
        mint: ctx.accounts.reward_mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::mint_to(cpi_ctx, amount)?;

    let clock = Clock::get()?;
    profile.record_reward(amount, clock.unix_timestamp);

    emit!(RewardClaimed {
        recipient: profile.authority,
        amount,
        total_claimed: profile.tokens_claimed,
    });

    msg!("Successfully minted {} reward tokens to {}", amount, profile.authority);
    Ok(())
}
