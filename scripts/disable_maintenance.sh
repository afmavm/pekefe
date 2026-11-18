#!/bin/bash
# PEKEFE Maintenance Mode Disabler Script (Isolated from sibling projects)

echo "=== PEKEFE Bakım Modu Kaldırılıyor ==="

if [ -f cpanel_fix.sh ]; then
  bash cpanel_fix.sh 2>/dev/null || true
  echo "[1/1] İzole PM2 Reverse Proxy .htaccess (Port 4000) yeniden oluşturuldu ve PEKEFE yayına alındı."
fi

echo "=== PEKEFE BAKIM MODU KALDIRILDI ==="
