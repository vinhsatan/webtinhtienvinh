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
    console.error('Destination src/legacy_api already exists. Aborting to avoid overwrite.');
    process.exit(1);
  }

  // ensure parent exists
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  fs.renameSync(src, dest);
  console.log('Locked API: moved src/app/api -> src/legacy_api');
  process.exit(0);
} catch (err) {
  console.error('Failed to lock API:', err);
  process.exit(2);
}
