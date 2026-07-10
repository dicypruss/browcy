import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(rootDir, 'build');
const zipPath = path.resolve(rootDir, 'browcy-extension-v0.0.1.zip');

// Clean and create build directory
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Copy manifest
fs.copyFileSync(
  path.resolve(rootDir, 'manifest.json'),
  path.resolve(buildDir, 'manifest.json')
);

// Copy dist (contains JS built by tsup)
const distDir = path.resolve(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, path.resolve(buildDir, 'dist'), { recursive: true });
}

// Copy src (contains HTML/CSS needed by manifest)
const srcDir = path.resolve(rootDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, path.resolve(buildDir, 'src'), { recursive: true });
}

// Copy icons
const iconsSrc = path.resolve(rootDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  fs.cpSync(iconsSrc, path.resolve(buildDir, 'icons'), { recursive: true });
}

// Zip the build folder
console.log(`Packaging extension to ${zipPath}...`);
try {
  execSync(`zip -r ${zipPath} .`, { cwd: buildDir, stdio: 'inherit' });
  console.log(`Successfully created zip archive: ${zipPath}`);
} catch (e) {
  console.error("Failed to create zip:", e.message);
  process.exit(1);
}
