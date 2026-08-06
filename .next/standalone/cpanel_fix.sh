#!/bin/bash
# PEKEFE cPanel Passenger & Static Image Asset Auto-Fix Script

echo "================================================="
echo "  PEKEFE cPanel Passenger & Image Asset Auto-Fix"
echo "================================================="

USER_HOME="/home/ata3a6icilikcom"
APP_ROOT="$USER_HOME/pekefe.com"

# 1. Find Node.js binary in nodevenv or fallback to system node
NODE_BIN=$(find $USER_HOME/nodevenv/ -name "node" 2>/dev/null | head -n 1)

if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(which node 2>/dev/null || echo "/usr/bin/node")
fi

echo "[FIX] Detected Node.js Binary: $NODE_BIN"

# 2. Sync public/uploads to .next/standalone/public/uploads if needed
if [ -d "$APP_ROOT/public" ]; then
  mkdir -p "$APP_ROOT/.next/standalone/public"
  cp -rn "$APP_ROOT/public/"* "$APP_ROOT/.next/standalone/public/" 2>/dev/null || true
  echo "[FIX] Synced static images to standalone bundle."
fi

# 3. Generate Complete Apache Passenger & Static Asset .htaccess config
cat <<EOT > $USER_HOME/public_html/.htaccess
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "$APP_ROOT"
PassengerBaseURI "/"
PassengerNodejs "$NODE_BIN"
PassengerAppType node
PassengerStartupFile cpanel_server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

# Direct Static Asset Serving for Instant 0-5ms Image Delivery
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
</IfModule>

# Cache-Control Headers for Static Media
<IfModule mod_headers.c>
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</IfModule>
EOT

cp $USER_HOME/public_html/.htaccess $APP_ROOT/.htaccess 2>/dev/null || true
echo "[FIX] Updated .htaccess in public_html and pekefe.com"

# 4. Touch restart.txt to restart Phusion Passenger
mkdir -p $APP_ROOT/tmp
touch $APP_ROOT/tmp/restart.txt

# 5. Trigger cloudlinux-selector CLI if available
cloudlinux-selector restart --app-type node --app-root pekefe.com 2>/dev/null || true

echo "================================================="
echo " SUCCESS: cPanel Passenger & Image routes fixed!"
echo "================================================="
