## 🚀 Chạy ngay (Local Dev)

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file môi trường từ mẫu (.env đã được gitignore — không commit)
cp .env.example .env

# 3. Khởi động dev server
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

**Đăng nhập mặc định (dev):**
| Email | Mật khẩu |
|-------|----------|
| `admin@dev.local` | `dev123` |

> Để dùng thông tin đăng nhập riêng, sửa `AUTH_EMAIL` và `AUTH_PASSWORD` trong file `.env` trước khi chạy.

---

## 🖥️ Deploy lên VPS

### Yêu cầu
- Node.js 20+
- PostgreSQL 14+ (nếu muốn đồng bộ dữ liệu lên server)
- Nginx
- PM2 (`npm install -g pm2`)

### Các bước

```bash
# 1. Clone & cài dependencies
git clone https://github.com/vinhsatan/webtinhtienvinh.git
cd webtinhtienvinh
npm install

# 2. Cấu hình môi trường production
cp .env.production.template .env
nano .env   # Điền đầy đủ các giá trị (xem hướng dẫn trong file)

# 3. Tạo bảng trong database (bỏ qua nếu VITE_NO_SERVER_SYNC=true)
export DB_CONN="postgres://user:pass@localhost:5432/dbname"
for f in database/migrations/*.sql; do psql "$DB_CONN" -f "$f"; done

# 4. Build
npm run build

# 5. Khởi động bằng PM2
pm2 start "npm run prod" --name web
pm2 save && pm2 startup
```

### Nginx
```bash
sudo cp nginx/app.production.conf /etc/nginx/sites-available/app.n8nvinhsatan.site
sudo ln -s /etc/nginx/sites-available/app.n8nvinhsatan.site /etc/nginx/sites-enabled/
sudo certbot --nginx -d app.n8nvinhsatan.site
sudo nginx -t && sudo systemctl reload nginx
```

### ⚠️ Bắt buộc đổi trước khi deploy
| Biến | Ý nghĩa | Cách tạo |
|------|---------|---------|
| `AUTH_EMAIL` | Email đăng nhập | Email của bạn |
| `AUTH_PASSWORD` | Mật khẩu đăng nhập | Mật khẩu mạnh |
| `IAM_PRIVATE_KEY` | JWT secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `DB_CONN` | Kết nối PostgreSQL | `postgres://user:pass@localhost:5432/dbname` |

### Chế độ không cần database
Nếu chỉ dùng 1 người và không cần đồng bộ, đặt `VITE_NO_SERVER_SYNC=true` — dữ liệu sẽ lưu trong trình duyệt. **Lưu ý:** dữ liệu sẽ mất nếu xóa cache trình duyệt, hãy export CSV thường xuyên.

---

**Project Summary**
- **Description:**: Dự án frontend/backend (mono-repo) giữ lại mã nguồn và cấu hình cần thiết để chạy ứng dụng web; đã loại bỏ hầu hết các cấu hình Docker theo yêu cầu.
- **Generated tree:**: See [repo-tree.mb](repo-tree.mb) for full tree (depth 4).

**What's Present**
- **Top-level:**: `.git`, `database`, `nginx`, `plugins`, `public`, `src`, plus build/config files (`package.json`, `tsconfig.json`, `vite.config.ts`, ...).
- **Main source:**: `src/` contains the application, APIs, components, utils and assets.
- **Server DB migrations:**: `database/migrations/` contains SQL migration files.
- **Nginx:**: `nginx/` contains conf files and `ssl/`.

**Detected Possible Breaks / Missing Items**
- **Deployment scripts referencing Docker / .env:**: `deploy-vps.sh` still checks for `docker`, `docker-compose` and expects a file named `.env.production`. If `.env.production` is missing, the script will fail. See `deploy-vps.sh` lines referencing `.env.production` and Docker.
- **Env watchers:**: `plugins/restartEnvFileChange.ts` watches `.env`, `.env.local`, `.env.<mode>` — if you removed `.env` files, the watcher will see nothing to reload (not harmful, but note).
- **Environment usage on client:**: `plugins/nextPublicProcessEnv.ts` exposes selected `process.env` to the client — ensure required env vars are present when building.
- **Dependency typo / suspicious package:**: `package.json` includes a dependency named `vaul` — likely a misspelling of `vault`. Verify whether this is intentional; if not, remove or replace with correct package.
- **References to removed Docker assets in docs/scripts:**: Some docs or scripts (e.g., earlier deleted Docker guides) were removed; other scripts like `deploy-vps.sh` still assume those assets/templates (see `.env.production.template` mention).

**`package.json` quick notes**
- **Scripts:**: `dev`, `typecheck`, `verify` — these are minimal and do not directly call Docker.
- **Dependencies:**: many frontend and server libs are present; no immediate missing package is detected here, but runtime env vars and DB access (Postgres) must be configured.

**Recommended Next Steps**
- **Decide deployment strategy:** remove or update `deploy-vps.sh` to match current deployment (or restore `.env.production.template` and reintroduce needed Docker files).
- **Verify env files:** recreate `.env` / `.env.production` from templates if you intend to run the app locally or deploy.
- **Fix dependency typo:** confirm `vaul` dependency; replace with `vault` or remove.
- **Run build & tests locally:**
  ```bash
  npm ci
  npm run build
  npm run typecheck
  ```
- **Audit scripts and docs:** search for leftover references to Docker or deleted files and either remove or update them.

**Where to look**
- Tree (depth 4): [repo-tree.mb](repo-tree.mb)
- Deployment script: `deploy-vps.sh`
- Env watcher plugin: `plugins/restartEnvFileChange.ts`
- Client env helper: `plugins/nextPublicProcessEnv.ts`
- Package manifest: `package.json`

If you want, I can:
- Push current commits to a remote (provide URL/credentials).
- Generate a short `.env.production.template` with placeholders.
- Run `npm ci` and `npm run build` here to verify the project builds (requires network and toolchain).

Generated: 2026-02-09
