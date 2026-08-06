#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Pre-built Bundle Mode + MySQL Sync)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Pull pre-built bundle from GitHub
echo "[1/5] Pulling pre-built bundle from GitHub..."
git fetch origin main
git reset --hard origin/main

# 3. Check .env
echo "[2/5] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# 4. MySQL Database Auto-Sync (if MySQL credentials configured in .env)
if grep -q "mysql:" .env 2>/dev/null; then
  echo "[3/5] Synchronizing MySQL database schema (Prisma)..."
  npx prisma db push --skip-generate 2>/dev/null || true
fi

# 5. Sync .htaccess to public_html for Apache Passenger Routing
echo "[4/5] Auto-fixing cPanel Passenger routes & .htaccess..."
bash cpanel_fix.sh 2>/dev/null || true

# 6. Instant Restart (No cPanel build overhead!)
echo "[5/5] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
