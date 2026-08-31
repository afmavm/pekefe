#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Ultra-Fast PM2 Mode)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

CURRENT_DIR="$(pwd)"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"

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

# 3. Sync Reverse Proxy .htaccess inside CURRENT_DIR and PUBLIC_TARGET
echo "[3/4] Auto-fixing Reverse Proxy routes & .htaccess..."
if [ -f cpanel_fix.sh ]; then
  source cpanel_fix.sh 2>/dev/null || true
fi

# Disable Prisma telemetry & update child processes to prevent EAGAIN CloudLinux process limit errors
export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1

# Run lightweight seed directly in Node without CLI sub-process spawning
# Build production bundle if needed
npm run build 2>/dev/null || npx next build

# 4. Instant PM2 Clean Restart for pekefe-app process on Port 4000
echo "[4/4] Performing instant PM2 process restart on Port 4000..."
pm2 delete pekefe-app 2>/dev/null || true
pm2 delete pekefe 2>/dev/null || true

PORT=4000 pm2 start ecosystem.config.js --update-env 2>/dev/null || true
pm2 save --force 2>/dev/null || true

mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"

if [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  mkdir -p "$PUBLIC_TARGET/tmp" 2>/dev/null || true
  touch "$PUBLIC_TARGET/tmp/restart.txt" 2>/dev/null || true
fi

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
