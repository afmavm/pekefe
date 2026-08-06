#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment & Self-Healing Script

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Deployment Sync"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Fetch & Pull latest changes from GitHub
echo "[1/5] Pulling latest updates from GitHub (main)..."
git fetch origin main
git reset --hard origin/main

# 3. Environment Setup
echo "[2/5] Checking environment (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# 4. Database Sync (Fixes SQLite Error Code 14)
echo "[3/5] Verifying SQLite database (prisma/dev.db)..."
npx prisma db push --skip-generate 2>/dev/null || true

# 5. Production Build
echo "[4/5] Building Next.js production bundle..."
npm run build

# 6. Restart Passenger Server
echo "[5/5] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
