const fs = require('fs');
const path = require('path');

function resolveSegments(...segments) {
  return path.resolve(__dirname, '..', ...segments);
}

const src = resolveSegments('src', 'app', 'api');
const dest = resolveSegments('src', 'legacy_api');

try {
  if (!fs.existsSync(src)) {
    console.log('No src/app/api folder found — nothing to lock.');
    process.exit(0);
  }

  if (fs.existsSync(dest)) {
    console.log('Destination src/legacy_api already exists — leaving as-is.');
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  // First attempt a safe recursive copy so legacy content is preserved even if rename is blocked.
  try {
    if (fs.cpSync) {
      fs.cpSync(src, dest, { recursive: true });
      console.log('Copied src/app/api -> src/legacy_api');
    } else {
      // Fallback: naive recursive copy
      const copyRecursive = (s, d) => {
        fs.mkdirSync(d, { recursive: true });
        for (const item of fs.readdirSync(s)) {
          const si = path.join(s, item);
          const di = path.join(d, item);
          const stat = fs.statSync(si);
          if (stat.isDirectory()) copyRecursive(si, di);
          else fs.copyFileSync(si, di);
        }
      };
      copyRecursive(src, dest);
      console.log('Copied (fallback) src/app/api -> src/legacy_api');
    }
  } catch (copyErr) {
    console.error('Copy failed:', copyErr);
    process.exit(2);
  }

  // Now attempt rename (move). This may fail on Windows if files are locked by editors.
  try {
    fs.renameSync(src, dest);
    console.log('Locked API: moved src/app/api -> src/legacy_api');
    process.exit(0);
  } catch (renameErr) {
    console.warn('Rename (move) failed — legacy copy created but original src/app/api remains.');
    console.warn('Rename error:', renameErr && renameErr.message);
    process.exit(0);
  }
} catch (err) {
  console.error('Failed to lock API:', err);
  process.exit(2);
}
