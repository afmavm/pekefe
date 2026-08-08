#!/bin/bash
# PEKEFE PM2 & ProxyPass .htaccess Generator (Port 4000)

CURRENT_DIR="$(pwd)"

# Generate PM2 Reverse Proxy .htaccess inside CURRENT_DIR
cat <<EOT > "$CURRENT_DIR/.htaccess"
# PEKEFE PM2 Reverse Proxy Execution (Port 4000)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Proxy all dynamic page requests to PM2 Node.js process on Port 4000
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

# Safely create symlinks inside public_html pointing to $CURRENT_DIR
mkdir -p ~/public_html 2>/dev/null || true
if [ -d ~/public_html ] && [ "$CURRENT_DIR" != "$HOME/public_html" ]; then
  ln -sfn "$CURRENT_DIR" ~/public_html/pekefe.com 2>/dev/null || true
  ln -sfn "$CURRENT_DIR" ~/public_html/pekefe 2>/dev/null || true
  echo "[SUCCESS] DocumentRoot symlinks created inside public_html for Pekefe!"
fi
