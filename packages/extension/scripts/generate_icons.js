import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.resolve(__dirname, '../icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// A beautiful, sleek SVG template
const svgTemplate = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a2a35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111116;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.3" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad1)" />
  <text x="50%" y="50%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="320" fill="#ffffff" dominant-baseline="central" text-anchor="middle" filter="url(#shadow)">B</text>
</svg>
`;

const svgTemplateConnected = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2e7d32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1b5e20;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.3" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad2)" />
  <text x="50%" y="50%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="320" fill="#ffffff" dominant-baseline="central" text-anchor="middle" filter="url(#shadow2)">B</text>
</svg>
`;

const sizes = [16, 48, 128];

async function generate() {
  const svgBuffer = Buffer.from(svgTemplate);
  const svgBufferConnected = Buffer.from(svgTemplateConnected);
  
  for (const size of sizes) {
    // Generate default (disconnected) icons
    const outputPath = path.resolve(iconsDir, `icon_${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
    
    // Generate connected icons
    const connectedPath = path.resolve(iconsDir, `icon_${size}_connected.png`);
    await sharp(svgBufferConnected)
      .resize(size, size)
      .png()
      .toFile(connectedPath);
    console.log(`Generated ${connectedPath}`);
  }
}

generate().catch(console.error);
