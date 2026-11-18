#!/bin/bash
# PEKEFE Ultra-Fast PM2 Reverse Proxy .htaccess Generator (Port 4000)
# MULTI-PROJECT ISOLATION GUARD: Only writes to pekefe.com / pekefe-app directories.
# NEVER touches /home/ata3a6icilikcom/public_html root or sibling project directories.

CURRENT_DIR="$(pwd)"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"

is_safe_pekefe_dir() {
  local target_dir="$1"
  if [ -z "$target_dir" ]; then
    return 1
  fi
  case "$target_dir" in
    "/home/ata3a6icilikcom"|"/home/ata3a6icilikcom/"|"/home/ata3a6icilikcom/public_html"|"/home/ata3a6icilikcom/public_html/")
      echo "[GUARD] Engellendi: Ana dizin ($target_dir) diğer projeye ait olduğu için dokunulmadı."
      return 1
      ;;
  esac
  local base_name
  base_name="$(basename "$target_dir")"
  case "$base_name" in
    *pekefe*|*PEKEFE*)
      return 0
      ;;
    *)
      echo "[GUARD] Engellendi: '$target_dir' PEKEFE dizini olmadığı için atlandı."
      return 1
      ;;
  esac
}

generate_htaccess() {
  local dir="$1"
  if ! is_safe_pekefe_dir "$dir"; then
    return 0
  fi

  mkdir -p "$dir" 2>/dev/null || true
  chmod 755 "$dir" 2>/dev/null || true

  # Remove any stale standalone .php files so Apache/LiteSpeed never invokes suPHP (which throws 500)
  # and instead proxies /paytr_callback.php directly to Next.js Port 4000
  rm -f "$dir/paytr_callback.php" "$dir/callback.php" "$dir/public/paytr_callback.php" "$dir/public/callback.php" 2>/dev/null || true

  cat <<'EOT' > "$dir/.htaccess"
# PEKEFE PM2 Reverse Proxy Routing (Port 4000 - Isolated from sibling projects)
<IfModule mod_rewrite.c>
    RewriteEngine On

    # 1. PayTR Callback / Webhook bildirimlerini HTTPS yönlendirmesine veya suPHP'ye takılmadan doğrudan Port 4000 Webhook API'sine ilet
    RewriteRule ^(paytr_callback\.php|callback\.php|api/webhooks/paytr|api/paytr/callback|api/checkout/callback|api/payment/callback)/?$ http://127.0.0.1:4000/api/webhooks/paytr [P,L]

    # 2. Force HTTPS for browser & mobile webviews
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # 3. Skip proxy ONLY for actual static asset files (NEVER skip .php so suPHP 500 error cannot occur)
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteCond %{REQUEST_URI} \.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js|json|xml|txt|ttf|eot)$ [NC]
    RewriteRule ^ - [L]

    # 4. Proxy ALL page and API requests to PM2 Node.js process (pekefe-app) on Port 4000
    RewriteRule ^(.*)$ http://127.0.0.1:4000/$1 [P,L]
</IfModule>

<IfModule mod_headers.c>
    # Allow CORS for mobile app WebViews and PayTR callbacks
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

    <FilesMatch "\.(jpg|jpeg|png|gif|webp|avif|ico|svg|mp4|webm|woff|woff2|css|js)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</IfModule>
EOT
  chmod 644 "$dir/.htaccess" 2>/dev/null || true
  echo "[SUCCESS] İzole .htaccess oluşturuldu: $dir/.htaccess"
}

generate_htaccess "$CURRENT_DIR"
if [ -d "$PUBLIC_TARGET" ] && [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  generate_htaccess "$PUBLIC_TARGET"
fi
echo "[SUCCESS] PM2 Reverse Proxy .htaccess ve PayTR Callback yönlendirmesi güvenle yapılandırıldı!"
