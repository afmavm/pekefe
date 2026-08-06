#!/bin/bash
# cPanel Passenger Auto-Fix Script

echo "================================================="
echo "  PEKEFE cPanel Passenger Route Auto-Fix"
echo "================================================="

USER_HOME="/home/ata3a6icilikcom"
APP_ROOT="$USER_HOME/pekefe.com"

# 1. Find Node.js binary in nodevenv or fallback to system node
NODE_BIN=$(find $USER_HOME/nodevenv/ -name "node" 2>/dev/null | head -n 1)

if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(which node 2>/dev/null || echo "/usr/bin/node")
fi

echo "[FIX] Detected Node.js Binary: $NODE_BIN"

# 2. Generate CloudLinux Passenger .htaccess config
cat <<EOT > $USER_HOME/public_html/.htaccess
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "$APP_ROOT"
PassengerBaseURI "/"
PassengerNodejs "$NODE_BIN"
PassengerAppType node
PassengerStartupFile cpanel_server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
EOT

cp $USER_HOME/public_html/.htaccess $APP_ROOT/.htaccess 2>/dev/null || true
echo "[FIX] Updated .htaccess in public_html and pekefe.com"

# 3. Touch restart.txt to restart Phusion Passenger
mkdir -p $APP_ROOT/tmp
touch $APP_ROOT/tmp/restart.txt

# 4. Trigger cloudlinux-selector CLI if available
cloudlinux-selector restart --app-type node --app-root pekefe.com 2>/dev/null || true

echo "================================================="
echo " SUCCESS: cPanel Passenger routes fixed and restarted!"
echo "================================================="
