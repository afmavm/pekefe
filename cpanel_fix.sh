#!/bin/bash
# PEKEFE Multi-DocumentRoot Passenger .htaccess Sync Generator

USER_HOME="/home/ata3a6icilikcom"
APP_ROOT="$USER_HOME/pekefe.com"

# Candidate DocumentRoots in cPanel for pekefe.com
TARGET_DIRS=(
  "$APP_ROOT"
  "$USER_HOME/public_html/pekefe"
  "$USER_HOME/public_html/pekefe.com"
)

# Generate Standalone Passenger .htaccess
cat <<EOT > $APP_ROOT/.htaccess
# Isolated Phusion Passenger Execution for Pekefe
PassengerEnabled on
PassengerAppRoot "$APP_ROOT"
PassengerStartupFile cpanel_server.js
PassengerAppType node
PassengerAppEnv production

<IfModule mod_rewrite.c>
    RewriteEngine On
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Route all dynamic page requests to Passenger Node.js app (Fixes 404)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ cpanel_server.js [QSA,L]
</IfModule>

<IfModule mod_headers.c>
    # Allow CORS for mobile app WebViews
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</IfModule>
EOT

# Sync .htaccess and cpanel_server.js across all candidate DocumentRoot paths
for dir in "${TARGET_DIRS[@]}"; do
  mkdir -p "$dir" 2>/dev/null || true
  cp "$APP_ROOT/.htaccess" "$dir/.htaccess" 2>/dev/null || true
  cp "$APP_ROOT/cpanel_server.js" "$dir/cpanel_server.js" 2>/dev/null || true
done

echo "[SUCCESS] Multi-DocumentRoot .htaccess & Passenger sync completed!"
