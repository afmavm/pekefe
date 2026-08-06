#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Pre-built Bundle Mode)

echo "================================================="
echo "  PEKEFE ERP & Web — GitHub Instant Deployment"
echo "================================================="

# 1. Navigate to project directory
cd ~/pekefe.com || exit 1

# 2. Pull pre-built bundle from GitHub
echo "[1/4] Pulling pre-built bundle from GitHub..."
git fetch origin main
git reset --hard origin/main

# 3. Check .env
echo "[2/4] Verifying environment configuration (.env)..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# 4. Sync .htaccess to public_html for Apache Passenger Routing
echo "[3/4] Syncing .htaccess to public_html..."
if [ -f .htaccess ]; then
  cp .htaccess ~/public_html/.htaccess 2>/dev/null || true
fi

# 5. Instant Restart (No cPanel build overhead!)
echo "[4/4] Restarting Phusion Passenger Node.js server..."
mkdir -p ~/pekefe.com/tmp
touch ~/pekefe.com/tmp/restart.txt

echo "================================================="
echo " SUCCESS: PEKEFE site updated and restarted!"
echo "================================================="
