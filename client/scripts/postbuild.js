const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const targetPath = path.join(__dirname, '..', '..', 'client', 'dist');

if (!fs.existsSync(distPath)) {
  console.warn('client/dist not found - build might have failed');
  process.exit(1);
}

console.log('✓ Client build complete, dist directory ready for server');
