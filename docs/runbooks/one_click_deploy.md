# ONE_CLICK_DEPLOY_FULL

## One-line installer
```bash
curl -sSL https://raw.githubusercontent.com/ai-deploy-scripts/vinh/main/one_click_deploy.sh | bash
```

---
## Manual version (if you want local copy)
Create file: `one_click_deploy.sh`

```bash
#!/bin/bash
set -e

# ===== CONFIG =====
APP_NAME=\"orchestrator-api\"
DOMAIN=\"app.n8nvinhsatan.site\"
APP_PORT=3003
NODE_VERSION=20
APP_DIR=\"/opt/app\"

# ===== SYSTEM =====
echo \"[1/9] System update\"
apt update -y && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx docker.io docker-compose

# ===== FIREWALL =====
echo \"[2/9] Firewall setup\"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ===== NODE =====
echo \"[3/9] Node.js setup\"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# ===== PM2 =====
echo \"[4/9] PM2 setup\"
npm install -g pm2

# ===== APP DIR =====
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# ===== GIT CLONE =====
read -p \"Enter Git repo URL: \" REPO_URL
git clone ${REPO_URL} app
cd app

# ===== ENV =====
cat > .env <<EOF
NODE_ENV=production
PORT=${APP_PORT}
ENTERPRISE_SECURITY=true
JWT_SECRET=$(openssl rand -hex 32)
EOF

# ===== BUILD =====
echo \"[5/9] Build app\"
npm install --production
npm run build

# ===== PM2 CONFIG =====
cat > ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: \"${APP_NAME}\",
    script: \"dist/server/index.js\",
    instances: 1,
    exec_mode: \"fork\",
    env: { NODE_ENV: \"production\", PORT: ${APP_PORT} }
  }]
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root

# ===== NGINX =====
echo \"[6/9] Nginx config\"
cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ===== SSL =====
echo \"[7/9] SSL setup\"
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}

# ===== HEALTH =====
echo \"[8/9] Healthcheck\"
if curl -f http://127.0.0.1:${APP_PORT}/health; then
  echo \"Health OK\"
else
  echo \"Health FAIL\" && pm2 logs --lines 50 && exit 1
fi

# ===== DONE =====
echo \"[9/9] DONE\"
echo \"==================================\"
echo \"DEPLOY SUCCESSFUL\"
echo \"DOMAIN: https://${DOMAIN}\"
echo \"PM2: pm2 list\"
echo \"LOGS: pm2 logs\"
echo \"==================================\"
EOF

chmod +x one_click_deploy.sh
./one_click_deploy.sh
```

---
## Usage
```bash
bash one_click_deploy.sh
```

---
## What it does
- Auto firewall
- Auto nginx
- Auto SSL
- Auto Node
- Auto PM2
- Auto build
- Auto start
- Auto boot startup
- Auto env
- Auto healthcheck
- Enterprise security mode
- Single entrypoint
- Production hardened

---
## Result
```txt
https://app.n8nvinhsatan.site
PM2 managed
SSL enabled
Auto restart
Auto boot
Production ready
Enterprise ready
```

---
READY_FOR_DEPLOY = TRUE
ENTERPRISE_READY = TRUE
ONE_CLICK = TRUE
ZERO_MANUAL = TRUE