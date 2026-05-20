const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([length, typeBuf, data, crc]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c2 = n;
      for (let k = 0; k < 8; k++) {
        c2 = c2 & 1 ? 0xedb88320 ^ (c2 >>> 1) : c2 >>> 1;
      }
      table[n] = c2;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const rawPixels = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawPixels[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      rawPixels[pixelOffset] = r;
      rawPixels[pixelOffset + 1] = g;
      rawPixels[pixelOffset + 2] = b;
      rawPixels[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawPixels, { level: 9 });
  const idatData = compressed;

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', idatData),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function createICO(pngBuffers) {
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2);
  iconDir.writeUInt16LE(pngBuffers.length, 4);

  const iconDirEntries = Buffer.alloc(16 * pngBuffers.length);
  const pngData = [];
  let offset = 6 + 16 * pngBuffers.length;

  for (let i = 0; i < pngBuffers.length; i++) {
    const entry = iconDirEntries.slice(i * 16, (i + 1) * 16);
    entry[0] = pngBuffers[i].length > 256 ? 0 : pngBuffers[i].length;
    entry[1] = pngBuffers[i].length > 256 ? 0 : pngBuffers[i].length;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(pngBuffers[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    pngData.push(pngBuffers[i]);
    offset += pngBuffers[i].length;
  }

  return Buffer.concat([iconDir, iconDirEntries, ...pngData]);
}

const publicDir = path.join(__dirname, 'public');

const png16 = createPNG(16, 16, 37, 99, 235);
const png32 = createPNG(32, 32, 37, 99, 235);
const png48 = createPNG(48, 48, 37, 99, 235);
const png180 = createPNG(180, 180, 37, 99, 235);
const png192 = createPNG(192, 192, 37, 99, 235);
const png512 = createPNG(512, 512, 37, 99, 235);

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), png512);

const ico = createICO([png16, png32, png48]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);

console.log('Favicon files generated successfully!');
console.log('- favicon.ico (16x16, 32x32, 48x48)');
console.log('- favicon-16x16.png');
console.log('- favicon-32x32.png');
console.log('- apple-touch-icon.png (180x180)');
console.log('- icon-192x192.png');
console.log('- icon-512x512.png');
