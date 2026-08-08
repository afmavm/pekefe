#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (PM2 Port 4000 Mode)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

CURRENT_DIR="$(pwd)"

# 1. Force reset local changes to ensure clean pull from GitHub
echo "[1/4] Cleaning local files & pulling latest build bundle from GitHub..."
git fetch origin main 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true
git pull origin main --force 2>/dev/null || true

# 2. Check .env
echo "[2/4] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi

# 3. Sync .htaccess inside CURRENT_DIR
echo "[3/4] Auto-fixing Reverse Proxy routes & .htaccess..."
if [ -f cpanel_fix.sh ]; then
  source cpanel_fix.sh 2>/dev/null || true
fi

# 4. Instant PM2 Server Restart on Port 4000
echo "[4/4] Restarting PEKEFE PM2 Node.js process (Port 4000)..."
PORT=4000 pm2 restart pekefe --update-env 2>/dev/null || PORT=4000 pm2 start cpanel_server.js --name "pekefe" --update-env 2>/dev/null || true
pm2 save 2>/dev/null || true

# Also touch restart.txt for Passenger fallback
mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
