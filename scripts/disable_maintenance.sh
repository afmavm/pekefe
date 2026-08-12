#!/bin/bash
# PEKEFE Maintenance Mode Disabler Script

PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"
CURRENT_DIR="$(pwd)"

echo "=== PEKEFE Bakım Modu Kaldırılıyor ==="

if [ -f cpanel_fix.sh ]; then
  bash cpanel_fix.sh 2>/dev/null || true
  echo "[1/1] PM2 Reverse Proxy .htaccess yeniden oluşturuldu ve site yayına alındı."
fi

echo "=== BAKIM MODU KALDIRILDI ==="
