import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.warn('client/dist not found - build might have failed');
  process.exit(1);
}

console.log('✓ Client build complete, dist directory ready for server');
