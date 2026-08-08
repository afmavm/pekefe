#!/bin/bash
# PEKEFE cPanel Configuration Fixer

CURRENT_DIR="$(pwd)"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"

# Generate Root .htaccess
cat <<EOT > "$CURRENT_DIR/.htaccess"
PassengerEnabled on
PassengerAppRoot "$CURRENT_DIR"
PassengerStartupFile cpanel_server.js
PassengerAppType node
PassengerAppEnv production

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ cpanel_server.js [QSA,L]
</IfModule>
EOT

echo "[SUCCESS] Base .htaccess generated in $CURRENT_DIR"

# Sync to public_html/pekefe.com
if [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  mkdir -p "$PUBLIC_TARGET" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.htaccess" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.env" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_TARGET/" 2>/dev/null || true
  
  cat <<EOT > "$PUBLIC_TARGET/.htaccess"
PassengerEnabled on
PassengerAppRoot "$PUBLIC_TARGET"
PassengerStartupFile cpanel_server.js
PassengerAppType node
PassengerAppEnv production

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ cpanel_server.js [QSA,L]
</IfModule>
EOT
  echo "[SUCCESS] Public target .htaccess generated in $PUBLIC_TARGET"
fi
