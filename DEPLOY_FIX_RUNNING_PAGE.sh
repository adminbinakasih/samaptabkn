#!/bin/bash

# Script untuk deploy fix running page ke VPS
# Jalankan script ini di VPS dengan: bash DEPLOY_FIX_RUNNING_PAGE.sh

echo "🚀 Deploying Running Page Fix..."
echo ""

# Masuk ke folder frontend
cd /var/www/bkn-running/frontend

echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🔄 Restarting frontend with PM2..."
pm2 restart bkn-frontend

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Test the app at: https://runner.binakasihnusantara.sch.id/running?id=1"
echo ""
echo "📝 Check logs with: pm2 logs bkn-frontend"
