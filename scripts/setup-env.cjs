#!/usr/bin/env node
/**
 * scripts/setup-env.cjs
 *
 * Tự động tạo file .env với IAM_PRIVATE_KEY ngẫu nhiên và các giá trị cần thiết.
 * Chạy bằng:  node scripts/setup-env.cjs
 * Hoặc:       npm run setup
 *
 * Nếu .env đã tồn tại, script sẽ cập nhật chỉ những key còn thiếu (không ghi đè
 * các giá trị bạn đã điền).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const TEMPLATE_DEV = path.join(ROOT, '.env.example');
const TEMPLATE_PROD = path.join(ROOT, '.env.production.template');

// ── helpers ──────────────────────────────────────────────────────────────────

function generateKey() {
  return crypto.randomBytes(64).toString('hex');
}

function parseEnv(text) {
  const map = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    map[key] = val;
  }
  return map;
}

/**
 * Reads one line from /dev/tty synchronously (bypasses stdin buffering).
 * Falls back to defaultValue when running in CI / non-TTY environments.
 */
function promptSync(question, defaultValue) {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  process.stdout.write(prompt);

  if (!process.stdin.isTTY) {
    // Non-interactive (piped / CI): just use default
    process.stdout.write((defaultValue || '') + '\n');
    return defaultValue || '';
  }

  // Interactive TTY: read from /dev/tty synchronously
  try {
    const buf = Buffer.alloc(1024);
    const fd = fs.openSync('/dev/tty', 'rs');
    let result = '';
    while (true) {
      const n = fs.readSync(fd, buf, 0, 1, null);
      if (n === 0) break;
      const ch = buf.slice(0, n).toString('utf8');
      if (ch === '\n' || ch === '\r') break;
      result += ch;
    }
    fs.closeSync(fd);
    return result.trim() || defaultValue || '';
  } catch (_) {
    return defaultValue || '';
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const isProd = args.includes('--prod');

  console.log('\n🔧  Thiết lập môi trường — webtinhtienvinh\n');

  // Read template
  const templateFile = isProd ? TEMPLATE_PROD : TEMPLATE_DEV;
  if (!fs.existsSync(templateFile)) {
    console.error('❌  Không tìm thấy file mẫu: ' + templateFile);
    process.exit(1);
  }
  const templateText = fs.readFileSync(templateFile, 'utf8');
  const templateVars = parseEnv(templateText);

  // Read existing .env (if any)
  let existingVars = {};
  if (fs.existsSync(ENV_FILE)) {
    existingVars = parseEnv(fs.readFileSync(ENV_FILE, 'utf8'));
    console.log('ℹ️   File .env đã tồn tại — chỉ cập nhật các key còn thiếu.\n');
  }

  // ── 1. IAM_PRIVATE_KEY ───────────────────────────────────────────────────
  let iamKey = existingVars['IAM_PRIVATE_KEY'] || '';
  const needNewKey = !iamKey || iamKey === 'dev-key-change-me' || iamKey.startsWith('CHANGE_ME');

  if (needNewKey) {
    iamKey = generateKey();
    console.log('🔑  IAM_PRIVATE_KEY đã được tạo tự động (128 ký tự hex ngẫu nhiên).\n');
  } else {
    console.log('✅  IAM_PRIVATE_KEY đã có — giữ nguyên.\n');
  }

  // ── 2. AUTH_EMAIL ────────────────────────────────────────────────────────
  const defaultEmail = existingVars['AUTH_EMAIL'] || templateVars['AUTH_EMAIL'] || '';
  const needEmail =
    !existingVars['AUTH_EMAIL'] ||
    existingVars['AUTH_EMAIL'] === 'your@email.com' ||
    existingVars['AUTH_EMAIL'] === 'admin@dev.local';

  let authEmail = existingVars['AUTH_EMAIL'] || defaultEmail;
  if (needEmail || isProd) {
    authEmail = promptSync('📧  Email đăng nhập (AUTH_EMAIL)', defaultEmail);
  }

  // ── 3. AUTH_PASSWORD ─────────────────────────────────────────────────────
  const defaultPass = isProd
    ? ''
    : existingVars['AUTH_PASSWORD'] || templateVars['AUTH_PASSWORD'] || '';
  const needPass =
    !existingVars['AUTH_PASSWORD'] ||
    existingVars['AUTH_PASSWORD'] === 'CHANGE_ME_strong_password' ||
    existingVars['AUTH_PASSWORD'] === 'dev123';

  let authPass = existingVars['AUTH_PASSWORD'] || defaultPass;
  if (needPass || isProd) {
    if (isProd) {
      console.log('\n🔒  Mật khẩu nên dài ít nhất 12 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.');
    }
    authPass = promptSync('🔒  Mật khẩu đăng nhập (AUTH_PASSWORD)', defaultPass);
  }

  // ── 4. DB_CONN (prod only) ───────────────────────────────────────────────
  let dbConn = existingVars['DB_CONN'] || '';
  if (isProd && (!dbConn || dbConn.startsWith('postgres://user:password'))) {
    console.log('\n🗄️   Kết nối PostgreSQL (để trống nếu dùng localStorage only + VITE_NO_SERVER_SYNC=true)');
    dbConn = promptSync('   DB_CONN', dbConn || 'postgres://user:password@localhost:5432/dbname');
  }

  // ── Build output ─────────────────────────────────────────────────────────
  const merged = Object.assign({}, templateVars, existingVars);
  merged['IAM_PRIVATE_KEY'] = iamKey;
  if (authEmail) merged['AUTH_EMAIL'] = authEmail;
  if (authPass) merged['AUTH_PASSWORD'] = authPass;
  if (dbConn) merged['DB_CONN'] = dbConn;

  // For dev mode, keep sensible defaults
  if (!isProd) {
    if (!merged['VITE_NO_SERVER_SYNC'] || merged['VITE_NO_SERVER_SYNC'] === 'false') {
      merged['VITE_NO_SERVER_SYNC'] = 'true';
    }
    if (!existingVars['VITE_API_URL']) merged['VITE_API_URL'] = '';
  }

  // Re-render: preserve comments + order from template, inject updated values
  const outputLines = templateText.split('\n').map(function(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return line;
    const key = trimmed.slice(0, idx).trim();
    return (key in merged) ? key + '=' + merged[key] : line;
  });

  fs.writeFileSync(ENV_FILE, outputLines.join('\n'), 'utf8');

  console.log('\n✅  File .env đã được tạo/cập nhật thành công!\n');
  console.log('   IAM_PRIVATE_KEY :', iamKey.slice(0, 16) + '…  (ẩn phần còn lại)');
  console.log('   AUTH_EMAIL      :', merged['AUTH_EMAIL']);
  console.log('   AUTH_PASSWORD   :', '*'.repeat((merged['AUTH_PASSWORD'] || '').length));

  if (isProd) {
    console.log('\n📋  Bước tiếp theo trên VPS:');
    console.log('   npm run build');
    console.log('   pm2 start "npm run prod" --name web');
  } else {
    console.log('\n📋  Bước tiếp theo:');
    console.log('   npm run dev   →  http://localhost:5173');
  }
  console.log();
}

try {
  main();
} catch (err) {
  console.error('❌  Lỗi:', err.message);
  process.exit(1);
}
