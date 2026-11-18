#!/bin/bash
# PEKEFE Maintenance Mode Enabler Script (Isolated from sibling projects)

PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"
CURRENT_DIR="$(pwd)"
BASE_NAME="$(basename "$CURRENT_DIR")"

case "$CURRENT_DIR" in
  "/home/ata3a6icilikcom"|"/home/ata3a6icilikcom/"|"/home/ata3a6icilikcom/public_html"|"/home/ata3a6icilikcom/public_html/")
    echo "[GUARD] Ana dizinde ($CURRENT_DIR) bakım modu çalıştırılamaz! Diğer proje korundu."
    exit 1
    ;;
esac

echo "=== PEKEFE Bakım Modu Aktifleştiriliyor ==="

if [[ "$BASE_NAME" == *pekefe* || "$BASE_NAME" == *PEKEFE* ]] && [ -f .htaccess.maintenance ]; then
  cp .htaccess.maintenance .htaccess
  echo "[1/2] Yerel PEKEFE .htaccess bakım moduna alındı."
fi

if [ -d "$PUBLIC_TARGET" ]; then
  cp public/maintenance.html "$PUBLIC_TARGET/maintenance.html" 2>/dev/null || true
  cp .htaccess.maintenance "$PUBLIC_TARGET/.htaccess" 2>/dev/null || true
  echo "[2/2] Canlı PEKEFE hedefi ($PUBLIC_TARGET) bakım moduna alındı."
fi

echo "=== PEKEFE BAKIM MODU BAŞARIYLA AKTİF ==="
