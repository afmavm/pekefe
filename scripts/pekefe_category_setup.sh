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

export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1
export UV_THREADPOOL_SIZE=1
export TOKIO_WORKER_THREADS=1
export RAYON_NUM_THREADS=1

echo "[PEKEFE] Kategori mimarisi ve ürün-kategori eşleştirmesi başlatılıyor..."
node "$CURRENT_DIR/scripts/pekefe_category_setup.js"
echo "[PEKEFE] İşlem tamamlandı."
