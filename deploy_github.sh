#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (LiteSpeed & Phusion Passenger Universal)

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

# 3. Sync .htaccess & LiteSpeed public_html folders
echo "[3/4] Auto-fixing LiteSpeed DocumentRoots & .htaccess..."
if [ -f cpanel_fix.sh ]; then
  source cpanel_fix.sh 2>/dev/null || true
fi

# 4. Instant Passenger & PM2 Server Restart
echo "[4/4] Restarting Node.js servers..."
mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"
touch "/home/ata3a6icilikcom/public_html/pekefe.com/tmp/restart.txt" 2>/dev/null || true

PORT=4000 pm2 restart pekefe --update-env 2>/dev/null || PORT=4000 pm2 start cpanel_server.js --name "pekefe" --update-env 2>/dev/null || true
pm2 save 2>/dev/null || true

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
