use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::errors::SolQuestError;

#[derive(Accounts)]
pub struct TransferReward<'info> {
    #[account(
        mut,
        constraint = from.owner == authority.key() @ SolQuestError::Unauthorized
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct RewardTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

pub fn handler(ctx: Context<TransferReward>, amount: u64) -> Result<()> {
    require!(amount > 0, SolQuestError::InvalidRewardAmount);

    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    emit!(RewardTransferred {
        from: ctx.accounts.from.key(),
        to: ctx.accounts.to.key(),
        amount,
    });

    msg!("Transferred {} reward tokens from {} to {}", amount, ctx.accounts.from.key(), ctx.accounts.to.key());
    Ok(())
}
