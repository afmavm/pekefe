#!/bin/bash
# PEKEFE Automatic Passenger .htaccess Generator

USER_HOME="/home/ata3a6icilikcom"
APP_ROOT="$USER_HOME/pekefe.com"

# Generate Standalone Passenger .htaccess for cPanel without Setup Node.js App GUI
cat <<EOT > $USER_HOME/public_html/.htaccess
# Automatic Phusion Passenger Execution
PassengerEnabled on
PassengerAppRoot "$APP_ROOT"
PassengerStartupFile cpanel_server.js
PassengerAppType node
PassengerAppEnv production

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</IfModule>
EOT

cp $USER_HOME/public_html/.htaccess $APP_ROOT/.htaccess 2>/dev/null || true
echo "[SUCCESS] PassengerEnabled configured in .htaccess"
