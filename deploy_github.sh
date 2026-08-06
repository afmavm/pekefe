#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment & Self-Healing Script

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Deployment Sync"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Fetch & Pull latest changes from GitHub
echo "[1/6] Pulling latest updates from GitHub (main)..."
git fetch origin main
git reset --hard origin/main

# 3. Environment Setup
echo "[2/6] Checking environment (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# 4. Sync .htaccess to public_html for Apache Passenger Routing
echo "[3/6] Syncing .htaccess to public_html..."
if [ -f .htaccess ]; then
  cp .htaccess ~/public_html/.htaccess 2>/dev/null || true
fi

# 5. Database Sync (Fixes SQLite Error Code 14)
echo "[4/6] Verifying SQLite database (prisma/dev.db)..."
npx prisma db push --skip-generate 2>/dev/null || true

# 6. Production Build
echo "[5/6] Building Next.js production bundle..."
npm run build

# 7. Restart Passenger Server
echo "[6/6] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
