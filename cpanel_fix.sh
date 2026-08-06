#!/bin/bash
# PEKEFE Isolated Passenger .htaccess Generator for /home/ata3a6icilikcom/pekefe.com

USER_HOME="/home/ata3a6icilikcom"
APP_ROOT="$USER_HOME/pekefe.com"

# Generate Standalone Passenger .htaccess ONLY inside APP_ROOT (Never touching public_html)
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
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
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

echo "[SUCCESS] Isolated .htaccess created inside $APP_ROOT/.htaccess"
