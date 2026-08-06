#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Universal Mode)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

CURRENT_DIR="$(pwd)"

# 1. Pull pre-built bundle from GitHub (Always latest commit)
echo "[1/4] Pulling latest build bundle from GitHub..."
git fetch origin main
git reset --hard origin/main
git pull origin main --force 2>/dev/null || true

# 2. Check .env
echo "[2/4] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi

# 3. Sync .htaccess inside CURRENT_DIR
echo "[3/4] Auto-fixing cPanel Passenger routes & .htaccess..."
if [ -f cpanel_fix.sh ]; then
  source cpanel_fix.sh 2>/dev/null || true
fi

# 4. Instant Passenger Restart
echo "[4/4] Restarting Phusion Passenger Node.js server..."
mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
