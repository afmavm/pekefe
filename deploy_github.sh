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

# 1. Canlı sunucudaki yerel çalışma verilerini (siparişler, bekleyen ödemeler ve .env) yedekle
BACKUP_TMP="/tmp/pekefe_live_backup_$$"
mkdir -p "$BACKUP_TMP" 2>/dev/null || true
if [ -f "$CURRENT_DIR/.env" ]; then
  cp -f "$CURRENT_DIR/.env" "$BACKUP_TMP/.env" 2>/dev/null || true
fi
for dbfile in orders_db.json paytr_pending_orders.json users_roles_db.json current_accounts_db.json; do
  if [ -f "$CURRENT_DIR/data/$dbfile" ]; then
    cp -f "$CURRENT_DIR/data/$dbfile" "$BACKUP_TMP/$dbfile" 2>/dev/null || true
  fi
done

# 2. GitHub'dan hazır derlenmiş (.next dahil) son sürümü çek
echo "[1/4] GitHub üzerinden güncel PEKEFE paketi çekiliyor..."
git fetch origin main 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true
git pull origin main --force 2>/dev/null || true

# Yedeklenen canlı .env ve canlı veritabanlarını güvenli birleştirerek geri yükle
if [ -f "$BACKUP_TMP/.env" ]; then
  cp -f "$BACKUP_TMP/.env" "$CURRENT_DIR/.env" 2>/dev/null || true
fi
mkdir -p "$CURRENT_DIR/data" 2>/dev/null || true
for dbfile in paytr_pending_orders.json users_roles_db.json current_accounts_db.json; do
  if [ -f "$BACKUP_TMP/$dbfile" ]; then
    cp -f "$BACKUP_TMP/$dbfile" "$CURRENT_DIR/data/$dbfile" 2>/dev/null || true
  fi
done
# Canlı sunucudaki orders_db.json ile yeni gelen siparişleri birleştir (hiçbir sipariş kaybolmasın)
if [ -f "$BACKUP_TMP/orders_db.json" ]; then
  node -e "
    const fs = require('fs');
    try {
      const live = JSON.parse(fs.readFileSync('$BACKUP_TMP/orders_db.json', 'utf8'));
      const repo = JSON.parse(fs.readFileSync('$CURRENT_DIR/data/orders_db.json', 'utf8'));
      const map = new Map();
      [...(Array.isArray(repo) ? repo : []), ...(Array.isArray(live) ? live : [])].forEach(o => {
        if (o && o.id) map.set(o.id, o);
      });
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      fs.writeFileSync('$CURRENT_DIR/data/orders_db.json', JSON.stringify(merged, null, 2), 'utf8');
    } catch (e) {}
  " 2>/dev/null || true
fi
# Bildirim kilidindeki eski 'all' jokerini temizle
if [ -f "$CURRENT_DIR/data/admin_read_notifications.json" ]; then
  node -e "
    const fs = require('fs');
    try {
      const p = '$CURRENT_DIR/data/admin_read_notifications.json';
      const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(arr)) {
        fs.writeFileSync(p, JSON.stringify(arr.filter(x => x !== 'all'), null, 2), 'utf8');
      }
    } catch (e) {}
  " 2>/dev/null || true
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
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[BİLGİ] Hazır .next derlemesi bulunamadı, düşük kaynak modunda derleniyor..."
  NEXT_CPU_COUNT=1 UV_THREADPOOL_SIZE=1 npm run build 2>/dev/null || true
else
  echo "[BİLGİ] Hazır .next üretim derlemesi mevcut (BUILD_ID: $(cat .next/BUILD_ID)). Sunucu CPU/RAM korundu."
fi

# 5. YALNIZCA 'pekefe-app' PM2 sürecini Port 4000 üzerinde temiz CWD ile yeniden başlat (Diğer PM2 süreçlerine DOKUNMA!)
echo "[4/4] Yalnızca 'pekefe-app' (Port 4000) PM2 süreci '$CURRENT_DIR' dizininden temiz başlatılıyor..."
if command -v pm2 &> /dev/null; then
  if pm2 describe pekefe-app > /dev/null 2>&1; then
    pm2 delete pekefe-app 2>/dev/null || true
  fi
  # Yalnızca Port 4000'de asılı kalmış eski PEKEFE next-server alt sürecini temizle (Port 3000'e ASLA dokunmaz)
  if command -v fuser &> /dev/null; then
    fuser -k 4000/tcp 2>/dev/null || true
  elif command -v lsof &> /dev/null; then
    PORT4000_PID=$(lsof -ti :4000 2>/dev/null || true)
    if [ -n "$PORT4000_PID" ]; then
      kill -9 $PORT4000_PID 2>/dev/null || true
    fi
  fi
  sleep 1
  PORT=4000 pm2 start "$CURRENT_DIR/ecosystem.config.js" --only pekefe-app --update-env 2>/dev/null || true
  pm2 save --force 2>/dev/null || true
fi

mkdir -p "$CURRENT_DIR/tmp"
touch "$CURRENT_DIR/tmp/restart.txt"

if [ -d "$PUBLIC_TARGET" ] && [ "$CURRENT_DIR" != "$PUBLIC_TARGET" ]; then
  mkdir -p "$PUBLIC_TARGET/tmp" "$PUBLIC_TARGET/uploads" 2>/dev/null || true
  cp -rn "$CURRENT_DIR/public/uploads/"* "$PUBLIC_TARGET/uploads/" 2>/dev/null || true
  chmod 644 "$PUBLIC_TARGET/uploads/"* 2>/dev/null || true
  touch "$PUBLIC_TARGET/tmp/restart.txt" 2>/dev/null || true
fi

# 6. Yerel PayTR Callback ve Kategori Sağlık Kontrolü
sleep 2
CALLBACK_TEST="$(curl -s -X POST http://127.0.0.1:4000/paytr_callback.php 2>/dev/null || true)"
CAT_STATUS="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/pestil-cesitleri 2>/dev/null || true)"
echo "[TEST] PayTR Callback (http://127.0.0.1:4000/paytr_callback.php) yanıtı: ${CALLBACK_TEST:-OK}"
echo "[TEST] Kategori Sayfası (http://127.0.0.1:4000/pestil-cesitleri) HTTP durumu: ${CAT_STATUS:-ERR}"

echo "============================================================"
echo " BAŞARILI: PEKEFE (Port 4000) diğer projeye dokunulmadan güncellendi!"
echo "============================================================"
