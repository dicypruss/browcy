import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const zipPath = path.resolve(rootDir, 'browcy-extension-v0.0.1.zip');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files to dist
const staticFiles = ['manifest.json', 'src/popup.html', 'src/popup.css'];
for (const file of staticFiles) {
  const src = path.resolve(rootDir, file);
  const dest = path.resolve(distDir, path.basename(file));
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Copy icons folder
const iconsSrc = path.resolve(rootDir, 'icons');
const iconsDest = path.resolve(distDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest);
  const icons = fs.readdirSync(iconsSrc);
  for (const icon of icons) {
    fs.copyFileSync(path.resolve(iconsSrc, icon), path.resolve(iconsDest, icon));
  }
}

import { execSync } from 'child_process';

// Zip the dist folder
console.log(`Packaging extension to ${zipPath}...`);
try {
  execSync(`zip -r ${zipPath} .`, { cwd: distDir, stdio: 'inherit' });
  console.log(`Successfully created zip archive: ${zipPath}`);
} catch (e) {
  console.error("Failed to create zip:", e.message);
  process.exit(1);
}
