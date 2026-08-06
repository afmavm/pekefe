#!/bin/bash
# PEKEFE Dynamic Isolated Passenger .htaccess Generator

CURRENT_DIR="$(pwd)"

# Generate Standalone Passenger .htaccess inside CURRENT_DIR
cat <<EOT > "$CURRENT_DIR/.htaccess"
# Isolated Phusion Passenger Execution for Pekefe
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

echo "[SUCCESS] PEKEFE .htaccess created strictly inside $CURRENT_DIR/.htaccess!"
