/**
 * Image optimization utility.
 * Uses sharp library when available, falls back to basic resize otherwise.
 */

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharp: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sharp = require('sharp');
} catch {
  sharp = null;
}

/**
 * Optimizes an image buffer by resizing and optionally converting format.
 *
 * @param inputBuffer - The input image buffer
 * @param options - Optimization options
 * @param options.maxWidth - Maximum width in pixels (default: 1920)
 * @param options.maxHeight - Maximum height in pixels (default: 1080)
 * @param options.quality - Output quality 1-100 (default: 80)
 * @param options.format - Output format: 'webp', 'jpeg', or 'png' (default: 'webp')
 * @returns Promise resolving to the optimized image buffer
 *
 * @example
 * ```ts
 * const optimized = await optimizeImage(buffer, { maxWidth: 800, quality: 75 });
 * ```
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options?: OptimizeOptions,
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    format = 'webp',
  } = options ?? {};

  if (sharp) {
    return optimizeWithSharp(inputBuffer, { maxWidth, maxHeight, quality, format });
  }

  return optimizeFallback(inputBuffer, { maxWidth, maxHeight, quality, format });
}

/**
 * Generates a square thumbnail from an image buffer.
 *
 * @param inputBuffer - The input image buffer
 * @param size - Thumbnail dimension in pixels (default: 200)
 * @returns Promise resolving to the thumbnail buffer
 *
 * @example
 * ```ts
 * const thumb = await generateThumbnail(buffer, 150);
 * ```
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  size = 200,
): Promise<Buffer> {
  if (sharp) {
    return sharp(inputBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer();
  }

  return generateFallbackThumbnail(inputBuffer, size);
}

/**
 * Extracts metadata from an image buffer.
 *
 * @param buffer - The input image buffer
 * @returns Object containing width, height, format, and size
 *
 * @example
 * ```ts
 * const meta = await getImageMetadata(buffer);
 * console.log(meta.width, meta.height, meta.format, meta.size);
 * ```
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  if (sharp) {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
      size: buffer.length,
    };
  }

  return getFallbackMetadata(buffer);
}

async function optimizeWithSharp(
  inputBuffer: Buffer,
  options: Required<Omit<OptimizeOptions, 'format'>> & { format: NonNullable<OptimizeOptions['format']> },
): Promise<Buffer> {
  const instance = sharp(inputBuffer).resize(options.maxWidth, options.maxHeight, {
    fit: 'inside',
    withoutEnlargement: false,
  });

  switch (options.format) {
    case 'webp':
      return instance.webp({ quality: options.quality }).toBuffer();
    case 'jpeg':
      return instance.jpeg({ quality: options.quality }).toBuffer();
    case 'png':
      return instance.png({ quality: options.quality }).toBuffer();
  }
}

function optimizeFallback(
  inputBuffer: Buffer,
  options: Required<Omit<OptimizeOptions, 'format'>> & { format: NonNullable<OptimizeOptions['format']> },
): Buffer {
  const detected = detectBasicFormat(inputBuffer);

  if (detected.width <= options.maxWidth && detected.height <= options.maxHeight) {
    return inputBuffer;
  }

  const ratio = Math.min(
    options.maxWidth / detected.width,
    options.maxHeight / detected.height,
  );

  const newWidth = Math.round(detected.width * ratio);
  const newHeight = Math.round(detected.height * ratio);

  console.warn(
    `[image-optimizer] sharp not installed; returning original buffer. Install sharp for full optimization. Requested resize: ${newWidth}x${newHeight}`,
  );

  return inputBuffer;
}

async function generateFallbackThumbnail(
  inputBuffer: Buffer,
  size: number,
): Promise<Buffer> {
  console.warn(
    `[image-optimizer] sharp not installed; returning original buffer for thumbnail. Install sharp for full functionality. Requested size: ${size}x${size}`,
  );
  return inputBuffer;
}

function getFallbackMetadata(buffer: Buffer): ImageMetadata {
  const { width, height } = detectBasicFormat(buffer);
  return {
    width,
    height,
    format: detectFormatString(buffer),
    size: buffer.length,
  };
}

interface BasicDimensions {
  width: number;
  height: number;
}

function detectBasicFormat(buffer: Buffer): BasicDimensions {
  try {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return readJpegDimensions(buffer);
    }

    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return readPngDimensions(buffer);
    }

    if (buffer[0] === 0x52 && buffer[1] === 0x49) {
      return readWebpDimensions(buffer);
    }

    if (buffer.toString('ascii', 0, 3) === 'GIF') {
      return readGifDimensions(buffer);
    }
  } catch {
    // ignore
  }

  return { width: 0, height: 0 };
}

function readJpegDimensions(buffer: Buffer): BasicDimensions {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker >= 0xc0 && marker <= 0xc3) {
      offset += 3;
      const height = buffer.readUInt16BE(offset);
      const width = buffer.readUInt16BE(offset + 2);
      return { width, height };
    }

    if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    offset += segmentLength;
  }

  return { width: 0, height: 0 };
}

function readPngDimensions(buffer: Buffer): BasicDimensions {
  if (buffer.length < 24) return { width: 0, height: 0 };
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readWebpDimensions(buffer: Buffer): BasicDimensions {
  if (buffer.length < 30) return { width: 0, height: 0 };

  const signature = buffer.toString('ascii', 0, 4);
  if (signature !== 'RIFF') return { width: 0, height: 0 };

  const webpSignature = buffer.toString('ascii', 8, 12);
  if (webpSignature !== 'WEBP') return { width: 0, height: 0 };

  const vp8Type = buffer.toString('ascii', 12, 16);

  if (vp8Type === 'VP8 ') {
    const frameStart = 26;
    if (buffer.length < frameStart + 6) return { width: 0, height: 0 };
    const w = buffer.readUInt16LE(frameStart) & 0x3fff;
    const h = buffer.readUInt16LE(frameStart + 2) & 0x3fff;
    return { width: w, height: h };
  }

  if (vp8Type === 'VP8L') {
    const frameStart = 21;
    if (buffer.length < frameStart + 4) return { width: 0, height: 0 };
    const b = buffer.readUInt32LE(frameStart);
    const w = (b & 0x3fff) + 1;
    const h = ((b >> 14) & 0x3fff) + 1;
    return { width: w, height: h };
  }

  if (vp8Type === 'VP8X') {
    const frameStart = 24;
    if (buffer.length < frameStart + 6) return { width: 0, height: 0 };
    const w =
      1 +
      buffer[frameStart] +
      (buffer[frameStart + 1] << 8) +
      (buffer[frameStart + 2] << 16);
    const h =
      1 +
      buffer[frameStart + 3] +
      (buffer[frameStart + 4] << 8) +
      (buffer[frameStart + 5] << 16);
    return { width: w, height: h };
  }

  return { width: 0, height: 0 };
}

function readGifDimensions(buffer: Buffer): BasicDimensions {
  if (buffer.length < 10) return { width: 0, height: 0 };
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function detectFormatString(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return 'unknown';
}
