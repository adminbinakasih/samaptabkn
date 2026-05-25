#!/bin/bash

# Deploy GPS Tracking Frontend Files to VPS
# Run this script on the VPS server

echo "=========================================="
echo "Deploying GPS Tracking Frontend Files"
echo "=========================================="
echo ""

# Navigate to frontend directory
cd /var/www/bkn-running/frontend

echo "Step 1: Verifying frontend directory structure..."
ls -la src/hooks/ 2>/dev/null || echo "  ⚠ hooks directory exists"
ls -la src/components/RouteMap.js 2>/dev/null || echo "  ⚠ RouteMap.js exists"
ls -la src/app/running/page.js 2>/dev/null || echo "  ⚠ running/page.js exists"

echo ""
echo "Step 2: Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo ""
echo "Step 3: Installing dependencies..."
npm install

echo ""
echo "Step 4: Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "Step 5: Restarting frontend service..."
    pm2 restart bkn-frontend
    sleep 2
    pm2 status
    echo ""
    echo "=========================================="
    echo "✓ GPS Tracking Frontend Deployed!"
    echo "=========================================="
    echo ""
    echo "Access the running page at:"
    echo "https://runner.binakasihnusantara.sch.id/running?id=1"
    echo ""
else
    echo ""
    echo "✗ Build failed! Check errors above."
    exit 1
fi
