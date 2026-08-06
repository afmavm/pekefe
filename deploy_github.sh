#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script
# Usage: ./deploy_github.sh

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Deployment Sync"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Fetch & Pull latest changes from GitHub
echo "[1/4] Pulling latest updates from GitHub (main)..."
git fetch origin main
git reset --hard origin/main

# 3. Environment & Dependencies
echo "[2/4] Syncing environment & dependencies..."
cp ~/.env ~/pekefe.com/.env 2>/dev/null || true

# 4. Next.js Build
echo "[3/4] Building Next.js production bundle..."
npm run build

# 5. Restart Passenger Server
echo "[4/4] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site has been updated & restarted!"
echo "================================================="
