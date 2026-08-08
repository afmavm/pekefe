#!/bin/bash
# PEKEFE PM2 Reverse Proxy .htaccess Generator (Port 4000)

CURRENT_DIR="$(pwd)"
PUBLIC_PEKEFE="/home/ata3a6icilikcom/public_html/pekefe.com"
PUBLIC_PEKEFE_ALT="/home/ata3a6icilikcom/public_html/pekefe"

# Generate Reverse Proxy .htaccess inside CURRENT_DIR
cat <<EOT > "$CURRENT_DIR/.htaccess"
# PEKEFE PM2 Reverse Proxy Routing (Port 4000)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Proxy all dynamic requests to PM2 Node.js process listening on Port 4000
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:4000/\$1 [P,L]
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

echo "[SUCCESS] PEKEFE Reverse Proxy .htaccess created inside $CURRENT_DIR/.htaccess!"

# Sync .htaccess and files to public_html/pekefe.com and public_html/pekefe
if [ "$CURRENT_DIR" != "$PUBLIC_PEKEFE" ]; then
  rm -f "$PUBLIC_PEKEFE" "$PUBLIC_PEKEFE_ALT" 2>/dev/null || true
  mkdir -p "$PUBLIC_PEKEFE" "$PUBLIC_PEKEFE_ALT" 2>/dev/null || true
  
  cp -f "$CURRENT_DIR/.htaccess" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.htaccess" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true

  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_PEKEFE/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_PEKEFE_ALT/" 2>/dev/null || true

  echo "[SUCCESS] Reverse Proxy configuration & build files synced to public_html!"
fi
