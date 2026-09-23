const fs = require('fs');
const path = require('path');

// Allow self-signed certs for Railway PostgreSQL SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targets = [
  path.join(__dirname, 'dist', 'src', 'main.js'),
  path.join(__dirname, 'dist', 'main.js'),
  path.join(__dirname, 'dist', 'src', 'main'),
  path.join(__dirname, 'dist', 'main'),
];

let started = false;
for (const target of targets) {
  if (fs.existsSync(target)) {
    console.log(`[Challo] Bootstrapping NestJS server from: ${target}`);
    require(target);
    started = true;
    break;
  }
}

if (!started) {
  console.error('[Challo] Could not find compiled main.js in dist/ or dist/src/!');
  process.exit(1);
}
