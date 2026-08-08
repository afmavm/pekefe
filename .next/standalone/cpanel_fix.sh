#!/bin/bash
# PEKEFE Direct Deployment & Sync Script for LiteSpeed Compatibility

CURRENT_DIR="$(pwd)"
PUBLIC_PEKEFE="/home/ata3a6icilikcom/public_html/pekefe.com"
PUBLIC_PEKEFE_ALT="/home/ata3a6icilikcom/public_html/pekefe"

# Generate Standalone Passenger .htaccess inside CURRENT_DIR
cat <<EOT > "$CURRENT_DIR/.htaccess"
# PEKEFE Passenger Execution
PassengerEnabled on
PassengerAppRoot "$CURRENT_DIR"
PassengerStartupFile cpanel_server.js
PassengerAppType node
PassengerAppEnv production

<IfModule mod_rewrite.c>
    RewriteEngine On
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Route dynamic requests to cpanel_server.js
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ cpanel_server.js [QSA,L]
</IfModule>

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOT

echo "[SUCCESS] PEKEFE .htaccess created inside $CURRENT_DIR/.htaccess!"

# Sync real files into public_html/pekefe.com and public_html/pekefe to bypass LiteSpeed Symlink Protection
if [ "$CURRENT_DIR" != "$PUBLIC_PEKEFE" ]; then
  # Remove symlink if present and create directory
  rm -f "$PUBLIC_PEKEFE" "$PUBLIC_PEKEFE_ALT" 2>/dev/null || true
  mkdir -p "$PUBLIC_PEKEFE" "$PUBLIC_PEKEFE_ALT" 2>/dev/null || true
  
  # Copy configuration and entrypoints
  cp -f "$CURRENT_DIR/.htaccess" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.htaccess" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true

  # Sync .next and public asset folders
  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true

  echo "[SUCCESS] Real build files synced to public_html/pekefe.com to bypass LiteSpeed Symlink Protection!"
fi
