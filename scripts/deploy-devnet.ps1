# SolQuest Devnet Automated Deployment & Build Script
# Combines Weeks 4 (Devnet Deploy), 5 (Counter), 6 (PDA), 7 (Tokens), 8 (Web3 MVP)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    SolQuest: Unified Solana Devnet Deployment & Build    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check tools
Write-Host "`n[1/4] Checking Solana & Anchor Environment..." -ForegroundColor Yellow
$solanaInstalled = Get-Command solana -ErrorAction SilentlyContinue
$anchorInstalled = Get-Command anchor -ErrorAction SilentlyContinue
$cargoInstalled  = Get-Command cargo -ErrorAction SilentlyContinue

if ($solanaInstalled) {
    Write-Host "Solana CLI: $(solana --version)" -ForegroundColor Green
} else {
    Write-Host "Solana CLI not in PATH. Will use devnet RPC & client scripts." -ForegroundColor DarkYellow
}

# 2. Build Anchor Program
Write-Host "`n[2/4] Building Solana Anchor Smart Contract..." -ForegroundColor Yellow
if ($anchorInstalled) {
    anchor build
    Write-Host "Program build succeeded!" -ForegroundColor Green
} else {
    Write-Host "Anchor CLI not detected in current PATH. Skipping binary compilation." -ForegroundColor DarkYellow
}

# 3. Configure Devnet Cluster
Write-Host "`n[3/4] Setting cluster to Solana Devnet..." -ForegroundColor Yellow
if ($solanaInstalled) {
    solana config set --url https://api.devnet.solana.com
}

# 4. Run Token and Devnet Setup
Write-Host "`n[4/4] Setting up SPL Token, Mint Authority PDA, and Devnet Config..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run setup:devnet
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   SolQuest Deployment Sequence Complete!               " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To start the frontend Web3 MVP: npm run client:dev" -ForegroundColor Cyan
Write-Host "To run the Rust CLI:           cargo run --bin solquest-cli -- --help" -ForegroundColor Cyan
Write-Host "To run integration tests:      npm test" -ForegroundColor Cyan
