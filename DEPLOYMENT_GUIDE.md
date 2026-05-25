# Panduan Deployment ke VPS
## Domain: http://samapta.binakasihnusantara.sch.id

---

## Prasyarat VPS
- Ubuntu 20.04 / 22.04
- Akses SSH sebagai root atau user dengan sudo
- Domain sudah diarahkan ke IP VPS (DNS A record)

---

## LANGKAH 1 — Install Dependencies di VPS

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v   # harus v18.x
npm -v

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## LANGKAH 2 — Setup Database MySQL

```bash
# Masuk ke MySQL
sudo mysql -u root -p

# Buat database dan user
CREATE DATABASE bkn_running CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bknuser'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT_DISINI';
GRANT ALL PRIVILEGES ON bkn_running.* TO 'bknuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema database
mysql -u bknuser -p bkn_running < /var/www/bkn-running/database/bkn_running.sql
```

---

## LANGKAH 3 — Upload Kode ke VPS

Dari komputer lokal (Windows), gunakan salah satu cara:

### Cara A — Git (Direkomendasikan)
```bash
# Di VPS
sudo mkdir -p /var/www/bkn-running
sudo chown $USER:$USER /var/www/bkn-running
cd /var/www/bkn-running
git clone https://github.com/USERNAME/REPO_NAME.git .
```

### Cara B — SCP / FileZilla
Upload seluruh folder project ke `/var/www/bkn-running/` di VPS.
Pastikan folder `node_modules` dan `.next` TIDAK ikut diupload.

---

## LANGKAH 4 — Konfigurasi Backend

```bash
cd /var/www/bkn-running/backend

# Buat file .env untuk production
nano .env
```

Isi file `.env` backend:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bkn_running
DB_USER=bknuser
DB_PASS=PASSWORD_KUAT_DISINI
JWT_SECRET=GANTI_DENGAN_STRING_RANDOM_PANJANG_MIN_32_KARAKTER
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

```bash
# Install dependencies backend
npm install --production
```

---

## LANGKAH 5 — Konfigurasi Frontend

```bash
cd /var/www/bkn-running/frontend

# Buat file .env.production (sudah dikonfigurasi untuk domain baru)
nano .env.production
```

Isi file `.env.production` frontend:
```env
NEXT_PUBLIC_API_URL=https://samapta.binakasihnusantara.sch.id/api
```

```bash
# Install dependencies frontend
npm install

# Build untuk production
npm run build
```

> ⚠️ Proses build bisa memakan waktu 3-5 menit, tunggu sampai selesai.

---

## LANGKAH 6 — Jalankan Aplikasi dengan PM2

```bash
cd /var/www/bkn-running

# Jalankan semua app sekaligus
pm2 start ecosystem.config.js --env production

# Cek status
pm2 status

# Lihat log jika ada error
pm2 logs bkn-backend
pm2 logs bkn-frontend

# Set PM2 auto-start saat VPS reboot
pm2 startup
pm2 save
```

---

## LANGKAH 7 — Konfigurasi Nginx

```bash
# Buat konfigurasi Nginx
sudo nano /etc/nginx/sites-available/samapta
```

Isi konfigurasi Nginx:
```nginx
server {
    listen 80;
    server_name samapta.binakasihnusantara.sch.id;

    # Frontend (Next.js) — port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API — port 5000
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan konfigurasi
sudo ln -s /etc/nginx/sites-available/samapta /etc/nginx/sites-enabled/

# Test konfigurasi Nginx
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## LANGKAH 8 — SSL/HTTPS dengan Let's Encrypt (Opsional tapi Direkomendasikan)

> ⚠️ GPS di browser WAJIB HTTPS. Jika aplikasi pakai fitur GPS, SSL harus dipasang.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan SSL certificate
sudo certbot --nginx -d samapta.binakasihnusantara.sch.id

# Ikuti instruksi, masukkan email, setujui terms
# Certbot akan otomatis update konfigurasi Nginx ke HTTPS

# Auto-renewal
sudo systemctl enable certbot.timer
```

Setelah SSL terpasang, update `.env.production` frontend jika belum HTTPS:
```env
NEXT_PUBLIC_API_URL=https://samapta.binakasihnusantara.sch.id/api
```
Lalu rebuild frontend:
```bash
cd /var/www/bkn-running/frontend
npm run build
pm2 restart bkn-frontend
```

---

## LANGKAH 9 — Verifikasi

Cek semua berjalan normal:
```bash
# Status PM2
pm2 status

# Test backend API
curl http://localhost:5000/
# Harus muncul: {"message":"BKN-Running API is running"}

# Test via domain
curl http://samapta.binakasihnusantara.sch.id/api/
```

Buka browser: `http://samapta.binakasihnusantara.sch.id`

---

## Perintah Berguna Setelah Deploy

```bash
# Restart semua app
pm2 restart all

# Lihat log real-time
pm2 logs

# Update kode (jika pakai Git)
cd /var/www/bkn-running
git pull
cd frontend && npm run build
pm2 restart all

# Cek error Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `502 Bad Gateway` | PM2 belum jalan, cek `pm2 status` |
| Database error | Cek kredensial di `.env` backend |
| GPS tidak jalan | Pasang SSL (HTTPS wajib untuk GPS) |
| Build frontend gagal | Cek `npm run build` di lokal dulu |
| Port sudah dipakai | `sudo lsof -i :3000` atau `:5000` |
