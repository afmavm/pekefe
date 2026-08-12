#!/bin/bash
# PEKEFE Maintenance Mode Enabler Script

PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"
CURRENT_DIR="$(pwd)"

echo "=== PEKEFE Bakım Modu Aktifleştiriliyor ==="

if [ -f .htaccess.maintenance ]; then
  cp .htaccess.maintenance .htaccess
  echo "[1/2] Yerel .htaccess bakım moduna alındı."
fi

if [ -d "$PUBLIC_TARGET" ]; then
  cp public/maintenance.html "$PUBLIC_TARGET/maintenance.html" 2>/dev/null || true
  cp .htaccess.maintenance "$PUBLIC_TARGET/.htaccess" 2>/dev/null || true
  echo "[2/2] Canlı hedef ($PUBLIC_TARGET) bakım moduna alındı."
fi

echo "=== BAKIM MODU BAŞARIYLA AKTİF ==="
