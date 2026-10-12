use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct UserProfile {
    /// Authority / owner of the decentralized profile
    pub authority: Pubkey,
    /// Profile display name (up to 32 chars)
    #[max_len(32)]
    pub username: String,
    /// Bio / profile description (up to 128 chars)
    #[max_len(128)]
    pub bio: String,
    /// On-chain counter tracking user actions (Week 5: Counter Program)
    pub counter: u64,
    /// Accumulated experience points
    pub xp: u64,
    /// Gamified level derived from counter
    pub level: u16,
    /// Total reward tokens claimed by this profile (Week 7: SPL Token)
    pub tokens_claimed: u64,
    /// Timestamp of profile creation
    pub created_at: i64,
    /// Timestamp of last interaction
    pub last_active_at: i64,
    /// Canonical PDA bump seed (Week 6: PDA Architecture)
    pub bump: u8,
}

impl UserProfile {
    pub const SEED_PREFIX: &'static [u8] = b"user-profile";

    /// Helper to increment counter and update experience / level
    pub fn increment(&mut self, timestamp: i64) {
        self.counter = self.counter.saturating_add(1);
        self.xp = self.xp.saturating_add(100);
        self.level = ((self.xp / 500) + 1) as u16;
        self.last_active_at = timestamp;
    }

    /// Helper to record claimed rewards
    pub fn record_reward(&mut self, amount: u64, timestamp: i64) {
        self.tokens_claimed = self.tokens_claimed.saturating_add(amount);
        self.last_active_at = timestamp;
    }
}
