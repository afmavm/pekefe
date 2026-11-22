#!/bin/bash
set -e

CURRENT_DIR=$(pwd)
case "$CURRENT_DIR" in
  *pekefe*) ;;
  *)
    echo "HATA: Bu betik yalnızca pekefe.com dizininde çalıştırılabilir! (Mevcut: $CURRENT_DIR)"
    exit 1
    ;;
esac

echo "[PEKEFE] Kategori mimarisi ve ürün-kategori eşleştirmesi başlatılıyor..."
node scripts/pekefe_category_setup.js
echo "[PEKEFE] İşlem tamamlandı."
