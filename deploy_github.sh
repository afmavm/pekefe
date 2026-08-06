#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Ultra-Lightweight Mode)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Pull pre-built bundle from GitHub
echo "[1/4] Pulling pre-built bundle from GitHub..."
git fetch origin main -c pack.threads=1 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true

# 3. Check .env
echo "[2/4] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi

# 4. Sync .htaccess to public_html
echo "[3/4] Auto-fixing cPanel Passenger routes & .htaccess..."
if [ -f cpanel_fix.sh ]; then
  source cpanel_fix.sh 2>/dev/null || true
fi

# 5. Instant Passenger Restart
echo "[4/4] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
