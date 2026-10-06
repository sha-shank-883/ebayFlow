const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create the SVG master for eBayFlow Favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#1E40AF" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Base Rounded Container with subtle border -->
  <rect x="16" y="16" width="480" height="480" rx="120" ry="120" fill="url(#bgGrad)" filter="url(#dropShadow)" />
  <rect x="20" y="20" width="472" height="472" rx="116" ry="116" fill="none" stroke="url(#glowGrad)" stroke-width="8" />

  <!-- Letter E -->
  <path d="M 112 144 L 240 144 C 252 144 260 152 260 164 C 260 176 252 184 240 184 L 168 184 L 168 232 L 228 232 C 240 232 248 240 248 252 C 248 264 240 272 228 272 L 168 272 L 168 328 L 244 328 C 256 328 264 336 264 348 C 264 360 256 368 244 368 L 112 368 C 100 368 92 360 92 348 L 92 164 C 92 152 100 144 112 144 Z" fill="#FFFFFF" />

  <!-- Letter F -->
  <path d="M 284 144 L 412 144 C 424 144 432 152 432 164 C 432 176 424 184 412 184 L 340 184 L 340 232 L 400 232 C 412 232 420 240 420 252 C 420 264 412 272 400 272 L 340 272 L 340 348 C 340 360 332 368 320 368 C 308 368 300 360 300 348 L 300 164 C 300 152 308 144 320 144 L 284 144 Z" fill="#FFFFFF" />

  <!-- Dynamic Energy Accent Dot in bottom right of F -->
  <circle cx="396" cy="348" r="24" fill="url(#accentGrad)" stroke="#FFFFFF" stroke-width="4" />
</svg>`;

const publicDir = path.resolve(__dirname, '../../frontend/public');
const appDir = path.resolve(__dirname, '../../frontend/src/app');

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent);

async function generate() {
  const svgBuf = Buffer.from(svgContent);

  const png16 = await sharp(svgBuf).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuf).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuf).resize(48, 48).png().toBuffer();
  const png180 = await sharp(svgBuf).resize(180, 180).png().toBuffer();
  const png192 = await sharp(svgBuf).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuf).resize(512, 512).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), png512);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);

  // Build ICO file format
  function createICO(buffers) {
    const count = buffers.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(count, 4);

    const dirEntries = Buffer.alloc(16 * count);
    let offset = 6 + 16 * count;
    const dataChunks = [];

    for (let i = 0; i < count; i++) {
      const buf = buffers[i];
      const entry = dirEntries.slice(i * 16, (i + 1) * 16);
      const size = [16, 32, 48][i] || 0;
      entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
      entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // planes
      entry.writeUInt16LE(32, 6); // bpp
      entry.writeUInt32LE(buf.length, 8); // size in bytes
      entry.writeUInt32LE(offset, 12); // offset
      dataChunks.push(buf);
      offset += buf.length;
    }

    return Buffer.concat([header, dirEntries, ...dataChunks]);
  }

  const icoBuf = createICO([png16, png32, png48]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

  console.log('Favicon generation complete!');
}

generate().catch(console.error);
