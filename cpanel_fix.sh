#!/bin/bash
# PEKEFE PM2 Reverse Proxy .htaccess Generator (Port 4000)

CURRENT_DIR="$(pwd)"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"
PUBLIC_ALT="/home/ata3a6icilikcom/public_html/pekefe"

# Generate PM2 ProxyPass .htaccess content without any cpanel_server.js rewrite rules
generate_htaccess() {
  cat <<EOT > "$1/.htaccess"
# PEKEFE PM2 Reverse Proxy Routing (Port 4000)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Proxy all dynamic page requests to PM2 Node.js process (pekefe-app) on Port 4000
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
}

# Generate in current directory
generate_htaccess "$CURRENT_DIR"
echo "[SUCCESS] PM2 Reverse Proxy .htaccess created in $CURRENT_DIR"

# Sync to public_html/pekefe.com and public_html/pekefe
if [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  rm -f "$PUBLIC_TARGET" "$PUBLIC_ALT" 2>/dev/null || true
  mkdir -p "$PUBLIC_TARGET" "$PUBLIC_ALT" 2>/dev/null || true
  
  generate_htaccess "$PUBLIC_TARGET"
  generate_htaccess "$PUBLIC_ALT"

  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/cpanel_server.js" "$PUBLIC_ALT/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -f "$CURRENT_DIR/.env" "$PUBLIC_ALT/" 2>/dev/null || true

  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/.next" "$PUBLIC_ALT/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_TARGET/" 2>/dev/null || true
  cp -rf "$CURRENT_DIR/public" "$PUBLIC_ALT/" 2>/dev/null || true

  echo "[SUCCESS] Reverse Proxy .htaccess & build files synced to public_html/pekefe.com!"
fi
