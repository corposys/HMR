import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_PACKAGES = [
  '@radix-ui/react-dialog',
  '@radix-ui/react-separator',
  '@radix-ui/react-tabs',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-slot',
  'react',
  'react-dom',
  'vite',
  'tailwindcss'
];

function verifyDeps() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ node_modules no existe. Ejecuta: npm install');
    process.exit(1);
  }

  const missing = [];
  
  for (const pkg of REQUIRED_PACKAGES) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      missing.push(pkg);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Paquetes faltantes:');
    missing.forEach(p => console.error(`  - ${p}`));
    console.error('\nEjecuta: npm install');
    process.exit(1);
  }

  console.log('✅ Todas las dependencias requeridas están instaladas');
  process.exit(0);
}

verifyDeps();