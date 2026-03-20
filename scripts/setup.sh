#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "  🏠 Copaw — project setup"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────

command -v node  >/dev/null 2>&1 || error "Node.js is not installed. Get it at https://nodejs.org"
command -v pnpm  >/dev/null 2>&1 || error "pnpm is not installed. Run: npm install -g pnpm"
command -v rustc >/dev/null 2>&1 || error "Rust is not installed. Get it at https://rustup.rs"
command -v cargo >/dev/null 2>&1 || error "Cargo is not installed. Get it at https://rustup.rs"

info "Node.js $(node -v)"
info "pnpm   $(pnpm -v)"
info "Rust   $(rustc --version | awk '{print $2}')"

# ── Install dependencies ─────────────────────────────────────────────

echo ""
echo "  📦 Installing dependencies..."
echo ""
pnpm install

# ── Copy .env files ──────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

copy_env() {
  local app="$1"
  local src="$ROOT_DIR/apps/$app/.env.example"
  local dst="$ROOT_DIR/apps/$app/.env"

  if [ ! -f "$src" ]; then
    warn "No .env.example found for $app — skipping"
    return
  fi

  if [ -f "$dst" ]; then
    warn "apps/$app/.env already exists — skipping (won't overwrite)"
  else
    cp "$src" "$dst"
    info "Created apps/$app/.env from .env.example"
  fi
}

echo ""
copy_env "desktop"
copy_env "server"

# ── Done ─────────────────────────────────────────────────────────────

echo ""
echo -e "  ${GREEN}Done!${NC} Run ${YELLOW}pnpm dev${NC} to start the server and desktop app."
echo ""
