#!/bin/bash
# PEKEFE Ultra-Fast PM2 Reverse Proxy .htaccess Generator (Port 4000)

CURRENT_DIR="$(pwd)"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"
PUBLIC_ALT="/home/ata3a6icilikcom/public_html/pekefe"

generate_htaccess() {
  mkdir -p "$1" 2>/dev/null || true
  cat <<EOT > "$1/.htaccess"
# PEKEFE PM2 Reverse Proxy Routing (Port 4000)
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS for mobile apps & webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Exclude B2B ecommerce subfolder/subdomain requests from proxying
    RewriteCond %{REQUEST_URI} ^/b2b [NC]
    RewriteRule ^ - [L]

    # Skip proxy ONLY for actual static files (images, css, js, fonts)
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_URI} \.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js|json|xml|txt|ttf|eot)$ [NC]
    RewriteRule ^ - [L]
    
    # Proxy ALL page requests (including root / homepage) to PM2 Node.js process (pekefe-app) on Port 4000
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

generate_htaccess "$CURRENT_DIR"
generate_htaccess "$PUBLIC_TARGET"
generate_htaccess "$PUBLIC_ALT"
echo "[SUCCESS] PM2 Reverse Proxy .htaccess safely generated without affecting B2B!"
