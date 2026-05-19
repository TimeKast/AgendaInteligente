# ============================================================
# TimeKast New Project Bootstrap Script v2.1
# ============================================================
# Usage: .\new-project.ps1 -ProjectName "my-project"
# ============================================================

param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectName
)

$ErrorActionPreference = "Continue"

# Configuration
$TEMPLATE_PATH = "C:\TimeKast\z-template"
$PROJECTS_PATH = "C:\TimeKast"
$GITHUB_ORG = "TimeKast"
$NEON_ORG_ID = "org-crimson-term-80666909"  # TimeKast org
$PROJECT_PATH = "$PROJECTS_PATH\$ProjectName"
$GITHUB_REPO = "$GITHUB_ORG/$ProjectName"

# Helper functions
function Write-Step { param($num, $msg) Write-Host "`n[$num] $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  WARN: $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "  ERROR: $msg" -ForegroundColor Red }

# ============================================================
# HEADER
# ============================================================
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  TimeKast New Project: $ProjectName" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# ============================================================
# VALIDATIONS
# ============================================================
Write-Step "1" "Validating..."

# Validate project name (lowercase, numbers, hyphens only)
if ($ProjectName -match "[^a-z0-9\-]") {
  Write-Err "Project name must be lowercase letters, numbers, and hyphens only"
  exit 1
}
Write-OK "Project name valid"

# Check if folder exists
if (Test-Path $PROJECT_PATH) {
  Write-Err "Folder already exists: $PROJECT_PATH"
  exit 1
}
Write-OK "Path available: $PROJECT_PATH"

# Check pnpm
$pnpmCheck = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCheck) {
  Write-Warn "pnpm not found, installing..."
  npm install -g pnpm 2>&1 | Out-Null
  $pnpmCheck = Get-Command pnpm -ErrorAction SilentlyContinue
  if (-not $pnpmCheck) {
    Write-Err "Failed to install pnpm"
    exit 1
  }
}
Write-OK "pnpm available"

# Check gh CLI
$ghCheck = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCheck) {
  Write-Err "GitHub CLI (gh) not installed. Install from: https://cli.github.com/"
  exit 1
}
Write-OK "GitHub CLI available"

# Check/install neonctl
$neonCheck = Get-Command neonctl -ErrorAction SilentlyContinue
if (-not $neonCheck) {
  Write-Warn "neonctl not found, installing..."
  npm install -g neonctl 2>&1 | Out-Null
  $neonCheck = Get-Command neonctl -ErrorAction SilentlyContinue
  if (-not $neonCheck) {
    Write-Err "Failed to install neonctl"
    exit 1
  }
}
Write-OK "Neon CLI available"

# Check neon auth
$neonMe = neonctl me 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Warn "Not authenticated with Neon. Running 'neonctl auth'..."
  neonctl auth
}
Write-OK "Neon authenticated"

# Check template exists
if (-not (Test-Path $TEMPLATE_PATH)) {
  Write-Err "Template not found at: $TEMPLATE_PATH"
  exit 1
}
Write-OK "Template found"

# ============================================================
# STEP 2: COPY TEMPLATE
# ============================================================
Write-Step "2" "Copying template..."

# robocopy exit codes: 0-7 are success, 8+ are errors
$robocopyResult = robocopy $TEMPLATE_PATH $PROJECT_PATH /E /XD .git node_modules .next .turbo /NFL /NDL /NJH /NJS /NC /NS /NP
if ($LASTEXITCODE -ge 8) {
  Write-Err "Failed to copy template"
  exit 1
}
Write-OK "Template copied to $PROJECT_PATH"

# ============================================================
# STEP 3: INITIALIZE GIT
# ============================================================
Write-Step "3" "Initializing git..."

Set-Location $PROJECT_PATH
git init 2>&1 | Out-Null
git branch -M main 2>&1 | Out-Null  # Force main branch name
git add -A 2>&1 | Out-Null
git commit -m "chore: initial project setup from z-template" 2>&1 | Out-Null
Write-OK "Git initialized with main branch"

# ============================================================
# STEP 4: CREATE GITHUB REPO
# ============================================================
Write-Step "4" "Creating GitHub repo..."

$ghResult = gh repo create $GITHUB_REPO --private --source=. --remote=origin --description "TimeKast project: $ProjectName" 2>&1
if ($LASTEXITCODE -eq 0) {
  git push -u origin main 2>&1 | Out-Null
  Write-OK "GitHub repo created: https://github.com/$GITHUB_REPO"
}
else {
  Write-Warn "GitHub repo creation failed. Create manually: gh repo create $GITHUB_REPO --private"
}

# ============================================================
# STEP 5: CREATE NEON DATABASE
# ============================================================
Write-Step "5" "Creating Neon database..."

$neonJson = neonctl projects create --name $ProjectName --org-id $NEON_ORG_ID --output json 2>&1
if ($LASTEXITCODE -eq 0) {
  $neonData = $neonJson | ConvertFrom-Json
  $connString = $neonData.connection_uris[0].connection_uri
  $projectId = $neonData.project.id
  Write-OK "Neon database created: $projectId"

  # ============================================================
  # STEP 6: CREATE .ENV.LOCAL
  # ============================================================
  Write-Step "6" "Creating .env.local..."

  $authSecret = [guid]::NewGuid().ToString().Replace("-", "") + [guid]::NewGuid().ToString().Replace("-", "")

  $envContent = @"
# ===========================================
# $ProjectName - Environment Variables
# ===========================================

# DATABASE (Neon)
DATABASE_URL="$connString"

# AUTH
AUTH_SECRET="$authSecret"
AUTH_TRUST_HOST="true"

# Google OAuth (optional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# GitHub OAuth (optional)
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Auth Feature Flags
NEXT_PUBLIC_AUTH_PASSWORD="true"
NEXT_PUBLIC_AUTH_MAGIC_LINK="false"
NEXT_PUBLIC_AUTH_REGISTRATION="true"
NEXT_PUBLIC_AUTH_PASSWORD_RESET="true"
NEXT_PUBLIC_AUTH_EMAIL_VERIFY="false"
NEXT_PUBLIC_AUTH_GOOGLE="false"
NEXT_PUBLIC_AUTH_GITHUB="false"

# Super Admin (for pnpm db:seed)
SUPER_ADMIN_EMAIL="admin@example.com"

# EMAIL
EMAIL_PROVIDER="none"
EMAIL_FROM="noreply@example.com"
# RESEND_API_KEY=""

# APP
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="$ProjectName"
NEXT_PUBLIC_COMPANY_NAME="TimeKast"
"@

  $envContent | Out-File -FilePath ".env.local" -Encoding utf8
  Write-OK ".env.local created with DATABASE_URL"
}
else {
  Write-Warn "Neon database creation failed. Create manually at: https://console.neon.tech"
}

# ============================================================
# STEP 7: INSTALL DEPENDENCIES
# ============================================================
Write-Step "7" "Installing dependencies (this takes ~2 min)..."

pnpm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-OK "Dependencies installed"
}
else {
  Write-Warn "pnpm install failed. Run manually: pnpm install"
}

# ============================================================
# STEP 8: CREATE DATABASE TABLES
# ============================================================
Write-Step "8" "Creating database tables..."

pnpm db:push 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-OK "Database tables created"
}
else {
  Write-Warn "db:push failed. Run manually: pnpm db:push"
}

# ============================================================
# SUCCESS SUMMARY
# ============================================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Project created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Local:   $PROJECT_PATH" -ForegroundColor White
Write-Host "  GitHub:  https://github.com/$GITHUB_REPO" -ForegroundColor White
Write-Host "  Neon:    https://console.neon.tech" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update SUPER_ADMIN_EMAIL in .env.local" -ForegroundColor White
Write-Host "  2. cd $PROJECT_PATH" -ForegroundColor White
Write-Host "  3. pnpm db:seed (creates super admin)" -ForegroundColor White
Write-Host "  4. pnpm dev" -ForegroundColor White
Write-Host ""
