#!/usr/bin/env node
/**
 * scripts/setup-env.cjs
 *
 * Tự động tạo file .env với:
 *  - IAM_PRIVATE_KEY ngẫu nhiên (128 hex)
 *  - AUTH_PASSWORD_HASH (argon2id) — mật khẩu KHÔNG bao giờ lưu plaintext
 * Chạy: npm run setup            (dev)
 *       npm run setup:prod       (VPS production)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const TEMPLATE_DEV = path.join(ROOT, '.env.example');
const TEMPLATE_PROD = path.join(ROOT, '.env.production.template');

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
    map[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return map;
}

/** Hash a plaintext password with argon2id via a child Node process (handles ESM/native). */
function hashPassword(plaintext) {
  const script = `
    import('argon2').then(a =>
      a.hash(${JSON.stringify(plaintext)}, {
        type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1
      })
    ).then(h => { process.stdout.write(h); process.exit(0); })
     .catch(() => { process.exit(1); });
  `;
  try {
    const hash = execFileSync(process.execPath, ['--input-type=module'], {
      input: script,
      cwd: ROOT,
      timeout: 30000,
      encoding: 'utf8',
    }).trim();
    if (!hash || !hash.startsWith('$argon2')) throw new Error('bad hash');
    return hash;
  } catch (e) {
    throw new Error('Không thể tạo hash argon2. Chạy npm install trước.\n' + e.message);
  }
}

/** Read one line from /dev/tty (bypasses piped stdin). Falls back to default in CI. */
function promptSync(question, defaultValue, forceDefault) {
  const prompt = defaultValue ? question + ' [' + defaultValue + ']: ' : question + ': ';
  process.stdout.write(prompt);
  if (forceDefault || !process.stdin.isTTY) {
    process.stdout.write((defaultValue || '') + '\n');
    return defaultValue || '';
  }
  try {
    const buf = Buffer.alloc(256);
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

function main() {
  const isProd = process.argv.includes('--prod');
  const nonInteractive = process.argv.includes('--yes') || process.argv.includes('-y');
  console.log('\n🔧  Thiết lập môi trường — webtinhtienvinh\n');

  const templateFile = isProd ? TEMPLATE_PROD : TEMPLATE_DEV;
  if (!fs.existsSync(templateFile)) {
    console.error('❌  Không tìm thấy file mẫu: ' + templateFile);
    process.exit(1);
  }
  const templateText = fs.readFileSync(templateFile, 'utf8');
  const templateVars = parseEnv(templateText);

  let existingVars = {};
  if (fs.existsSync(ENV_FILE)) {
    existingVars = parseEnv(fs.readFileSync(ENV_FILE, 'utf8'));
    console.log('ℹ️   File .env đã tồn tại — chỉ cập nhật các key còn thiếu.\n');
  }

  // ── 1. IAM_PRIVATE_KEY ──────────────────────────────────────────────────
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
    authEmail = promptSync('📧  Email đăng nhập (AUTH_EMAIL)', defaultEmail, nonInteractive);
  }

  // ── 3. AUTH_PASSWORD → AUTH_PASSWORD_HASH (argon2id) ────────────────────
  const existingHash = existingVars['AUTH_PASSWORD_HASH'] || '';
  const needHash =
    !existingHash ||
    existingHash === 'CHANGE_ME' ||
    existingHash.startsWith('CHANGE_ME');

  let passwordHash = existingHash;
  if (needHash || isProd) {
    if (isProd) {
      console.log('\n🔒  Mật khẩu nên dài ít nhất 12 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.');
    }
    const defaultPassHint = isProd ? '' : 'dev123';
    const plainPass = promptSync('🔒  Mật khẩu đăng nhập (sẽ được mã hoá argon2)', defaultPassHint, nonInteractive);
    if (plainPass) {
      process.stdout.write('   ⏳  Đang mã hoá mật khẩu...');
      passwordHash = hashPassword(plainPass);
      process.stdout.write(' ✅\n');
    }
  } else {
    console.log('✅  AUTH_PASSWORD_HASH đã có — giữ nguyên.\n');
  }

  // ── 4. DB_CONN (prod only) ───────────────────────────────────────────────
  let dbConn = existingVars['DB_CONN'] || '';
  if (isProd && (!dbConn || dbConn.startsWith('postgres://user:password'))) {
    console.log('\n🗄️   Kết nối PostgreSQL (để trống nếu dùng localStorage only + VITE_NO_SERVER_SYNC=true)');
    dbConn = promptSync('   DB_CONN', dbConn || 'postgres://user:password@localhost:5432/dbname', nonInteractive);
  }

  // ── Build output ─────────────────────────────────────────────────────────
  const merged = Object.assign({}, templateVars, existingVars);
  merged['IAM_PRIVATE_KEY'] = iamKey;
  if (authEmail) merged['AUTH_EMAIL'] = authEmail;
  if (passwordHash) merged['AUTH_PASSWORD_HASH'] = passwordHash;
  // Remove plaintext password if present (security: never store plaintext)
  delete merged['AUTH_PASSWORD'];
  if (dbConn) merged['DB_CONN'] = dbConn;

  if (!isProd) {
    if (!merged['VITE_NO_SERVER_SYNC'] || merged['VITE_NO_SERVER_SYNC'] === 'false') {
      merged['VITE_NO_SERVER_SYNC'] = 'true';
    }
    if (!existingVars['VITE_API_URL']) merged['VITE_API_URL'] = '';
  }

  // Re-render: preserve comments + order from template, inject updated values
  // Also inject AUTH_PASSWORD_HASH line after AUTH_EMAIL if not in template
  let outputLines = templateText.split('\n').map(function(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return line;
    const key = trimmed.slice(0, idx).trim();
    if (key === 'AUTH_PASSWORD') {
      // Replace AUTH_PASSWORD line with AUTH_PASSWORD_HASH
      return passwordHash ? 'AUTH_PASSWORD_HASH=' + passwordHash : null;
    }
    return (key in merged) ? key + '=' + merged[key] : line;
  }).filter(function(l) { return l !== null; });

  // Ensure AUTH_PASSWORD_HASH is in output if not already
  const hasHashLine = outputLines.some(function(l) { return l.startsWith('AUTH_PASSWORD_HASH='); });
  if (!hasHashLine && passwordHash) {
    // Insert after AUTH_EMAIL line
    const emailIdx = outputLines.findIndex(function(l) { return l.startsWith('AUTH_EMAIL='); });
    const insertAt = emailIdx >= 0 ? emailIdx + 1 : outputLines.length;
    outputLines.splice(insertAt, 0, 'AUTH_PASSWORD_HASH=' + passwordHash);
  }

  fs.writeFileSync(ENV_FILE, outputLines.join('\n'), 'utf8');

  console.log('\n✅  File .env đã được tạo/cập nhật thành công!\n');
  console.log('   IAM_PRIVATE_KEY    :', iamKey.slice(0, 16) + '…  (ẩn)');
  console.log('   AUTH_EMAIL         :', merged['AUTH_EMAIL'] || authEmail);
  console.log('   AUTH_PASSWORD_HASH :', (passwordHash || '').slice(0, 20) + '…  (argon2id, không thể đảo ngược)');
  console.log('\n🔐  Mật khẩu thật KHÔNG được lưu ở bất kỳ đâu trong file cấu hình.');
  console.log('   Chỉ có hash argon2 được lưu — người khác không thể đăng nhập dù thấy file .env.\n');

  if (isProd) {
    console.log('📋  Bước tiếp theo trên VPS:');
    console.log('   npm run build');
    console.log('   pm2 start "npm run prod" --name web');
  } else {
    console.log('📋  Bước tiếp theo:');
    console.log('   npm run dev   →  http://localhost:5173');
  }
  console.log();
}

try {
  main();
} catch (err) {
  console.error('\n❌  Lỗi:', err.message);
  process.exit(1);
}
