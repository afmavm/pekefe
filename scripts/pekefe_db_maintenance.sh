#!/bin/bash
# PEKEFE Izole Canli Veritabani Bakim & Tutarlilik Betigi
# Ayni sunucudaki diger projeye (public_html / Port 3000) HICBIR SEKILDE DOKUNMAZ.

set -e

if [ -f "$HOME/pekefe.com/prisma/schema.prisma" ]; then
  TARGET_DIR="$HOME/pekefe.com"
elif [ -f "$HOME/public_html/pekefe.com/prisma/schema.prisma" ]; then
  TARGET_DIR="$HOME/public_html/pekefe.com"
else
  echo "[KRITIK HATA] PEKEFE proje dizini bulunamadi!"
  exit 1
fi

cd "$TARGET_DIR" || exit 1
CURRENT_DIR="$(pwd)"

# Guvenlik kilidi: Ana dizin veya public_html kokunde calistirmayi engelle
case "$CURRENT_DIR" in
  "/home/ata3a6icilikcom"|"/home/ata3a6icilikcom/"|"/home/ata3a6icilikcom/public_html"|"/home/ata3a6icilikcom/public_html/")
    echo "[KRITIK HATA] Bu betik ana dizinde ($CURRENT_DIR) calistirilamaz!"
    exit 1
    ;;
esac

case "$CURRENT_DIR" in
  *pekefe*|*PEKEFE*)
    echo "[OK] Izole PEKEFE dizini dogrulandi: $CURRENT_DIR"
    ;;
  *)
    echo "[KRITIK HATA] Bulundugunuz dizin PEKEFE degil ($CURRENT_DIR)!"
    exit 1
    ;;
esac

export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1
export UV_THREADPOOL_SIZE=1

node "$CURRENT_DIR/scripts/pekefe_db_maintenance.js"
