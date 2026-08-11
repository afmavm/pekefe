#!/bin/bash
# PEKEFE Production Auto-Deploy Script for Linux VPS / PM2
# Usage: ./deploy.sh

set -e

echo "=== PEKEFE Canlı Dağıtım Başlatıldı: $(date) ==="

# 1. Pull latest code from master branch
echo "1/5 Git değişiklikleri çekiliyor..."
git pull origin master

# 2. Install production dependencies
echo "2/5 Bağımlılıklar yükleniyor..."
npm ci --only=production || npm install

# 3. Run database migrations
echo "3/5 Veritabanı migration uygulanıyor..."
npx prisma migrate deploy

# 4. Build production bundle
echo "4/5 Production build alınıyor..."
npm run build

# 5. Reload PM2 process
echo "5/5 PM2 uygulaması yeniden başlatılıyor..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js || pm2 restart pekefe-app || pm2 restart 0
    pm2 save
    echo "=== DAĞITIM BAŞARIYLA TAMAMLANDI ==="
else
    echo "PM2 bulunamadı, 'npm start' ile başlatabilirsiniz."
fi
