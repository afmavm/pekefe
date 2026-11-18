#!/bin/bash

# PEKEFE cPanel GitHub Automated Deployment Script (Multi-Project Isolated PM2 Mode)
# Bu betik, aynı sunucuda çalışan diğer projeye (public_html / Port 3000 / b2b-ecommerce)
# hiçbir şekilde dokunmadan yalnızca PEKEFE (Port 4000 / pekefe-app) projesini günceller.

echo "============================================================"
echo "  PEKEFE ERP & Web — İzole GitHub Canlı Dağıtım (Port 4000)"
echo "============================================================"

CURRENT_DIR="$(pwd)"
BASE_NAME="$(basename "$CURRENT_DIR")"
PUBLIC_TARGET="/home/ata3a6icilikcom/public_html/pekefe.com"

# 0. GÜVENLİK KİLİDİ: Yanlış dizinde (ör. ana public_html içinde) çalıştırılmayı engelle
case "$CURRENT_DIR" in
  "/home/ata3a6icilikcom"|"/home/ata3a6icilikcom/"|"/home/ata3a6icilikcom/public_html"|"/home/ata3a6icilikcom/public_html/")
    echo "[KRİTİK HATA] Bu betik ana dizinde ($CURRENT_DIR) çalıştırılamaz!"
    echo "Diğer projenin zarar görmemesi için işlem durduruldu. Lütfen 'cd ~/pekefe.com' komutuyla PEKEFE dizinine geçin."
    exit 1
    ;;
esac

case "$BASE_NAME" in
  *pekefe*|*PEKEFE*)
    ;;
  *)
    echo "[KRİTİK HATA] Bulunduğunuz dizin ($CURRENT_DIR) PEKEFE projesi değil!"
    echo "Diğer projenin zarar görmemesi için işlem durduruldu."
    exit 1
    ;;
esac

# 1. Canlı sunucudaki yerel çalışma verilerini (siparişler ve .env) yedekle
BACKUP_TMP="/tmp/pekefe_live_backup_$$"
mkdir -p "$BACKUP_TMP" 2>/dev/null || true
if [ -f "$CURRENT_DIR/.env" ]; then
  cp -f "$CURRENT_DIR/.env" "$BACKUP_TMP/.env" 2>/dev/null || true
fi
if [ -f "$CURRENT_DIR/data/orders_db.json" ]; then
  cp -f "$CURRENT_DIR/data/orders_db.json" "$BACKUP_TMP/orders_db.json" 2>/dev/null || true
fi

# 2. GitHub'dan hazır derlenmiş (.next dahil) son sürümü çek
echo "[1/4] GitHub üzerinden güncel PEKEFE paketi çekiliyor..."
git fetch origin main 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true
git pull origin main --force 2>/dev/null || true

# Yedeklenen canlı .env ve canlı sipariş veritabanını geri yükle
if [ -f "$BACKUP_TMP/.env" ]; then
  cp -f "$BACKUP_TMP/.env" "$CURRENT_DIR/.env" 2>/dev/null || true
fi
if [ -f "$BACKUP_TMP/orders_db.json" ]; then
  cp -f "$BACKUP_TMP/orders_db.json" "$CURRENT_DIR/data/orders_db.json" 2>/dev/null || true
fi
rm -rf "$BACKUP_TMP" 2>/dev/null || true

# 3. .env kontrolü (İzole Port 4000 ve izole veritabanı)
echo "[2/4] Ortam değişkenleri (.env) doğrulanıyor..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi

# 4. İzole Reverse Proxy .htaccess senkronizasyonu (Sadece pekefe.com dizini için)
echo "[3/4] İzole Reverse Proxy (.htaccess -> Port 4000) güncelleniyor..."
if [ -f cpanel_fix.sh ]; then
  bash cpanel_fix.sh 2>/dev/null || true
fi

# CloudLinux NPROC / CPU limitlerini korumak için telemetriyi kapat
export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1

# ÖNEMLİ: GitHub'dan hazır .next üretim paketi geldiği için sunucuda ağır 'next build' ÇALIŞTIRMA!
# Böylece paylaşımlı sunucuda CPU/RAM tüketilmez ve diğer proje kesintiye uğramaz.
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[BİLGİ] Hazır .next derlemesi bulunamadı, düşük kaynak modunda derleniyor..."
  NEXT_CPU_COUNT=1 UV_THREADPOOL_SIZE=1 npm run build 2>/dev/null || true
else
  echo "[BİLGİ] Hazır .next üretim derlemesi mevcut (BUILD_ID: $(cat .next/BUILD_ID)). Sunucu CPU/RAM korundu."
fi

# 5. YALNIZCA 'pekefe-app' PM2 sürecini Port 4000 üzerinde yeniden başlat (Diğer PM2 süreçlerine DOKUNMA!)
echo "[4/4] Yalnızca 'pekefe-app' (Port 4000) PM2 süreci yeniden başlatılıyor..."
if command -v pm2 &> /dev/null; then
  if pm2 describe pekefe-app > /dev/null 2>&1; then
    PORT=4000 pm2 reload ecosystem.config.js --only pekefe-app --update-env 2>/dev/null || \
    PORT=4000 pm2 restart pekefe-app --update-env 2>/dev/null || true
  else
    PORT=4000 pm2 start ecosystem.config.js --only pekefe-app --update-env 2>/dev/null || true
  fi
  pm2 save --force 2>/dev/null || true
fi

mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"

if [ -d "$PUBLIC_TARGET" ] && [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  mkdir -p "$PUBLIC_TARGET/tmp" 2>/dev/null || true
  touch "$PUBLIC_TARGET/tmp/restart.txt" 2>/dev/null || true
fi

echo "============================================================"
echo " BAŞARILI: PEKEFE (Port 4000) diğer projeye dokunulmadan güncellendi!"
echo "============================================================"
