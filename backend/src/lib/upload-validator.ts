import { v4 as uuidv4 } from 'uuid';

/**
 * Allowed MIME types for image file uploads.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Maximum allowed file size in bytes (5MB).
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validates that a file's MIME type is in the allowed image types list.
 *
 * @param file - The file object or an object with a `type` property.
 * @returns `true` if the file type is allowed, `false` otherwise.
 */
export function validateFileType(file: File | { type: string }): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Validates that a file's size does not exceed the specified maximum.
 *
 * @param file - The file object or an object with a `size` property.
 * @param maxSize - Optional maximum size in bytes. Defaults to `MAX_FILE_SIZE`.
 * @returns `true` if the file size is within the limit, `false` otherwise.
 */
export function validateFileSize(
  file: File | { size: number },
  maxSize: number = MAX_FILE_SIZE,
): boolean {
  return file.size <= maxSize;
}

/**
 * Generates a safe, unique filename based on a UUID while preserving
 * the original file extension.
 *
 * @param originalName - The original filename (e.g., "my photo.PNG").
 * @returns A string like "a1b2c3d4-e5f6-7890-abcd-ef1234567890.png".
 */
export function generateSafeFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const safeExt = sanitizeFilename(ext);
  return `${uuidv4()}${safeExt ? `.${safeExt}` : ''}`;
}

/**
 * Removes potentially dangerous characters from a filename.
 * Keeps only alphanumeric characters, hyphens, underscores, and dots.
 *
 * @param filename - The raw filename string to sanitize.
 * @returns A sanitized filename string.
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * Reads an image file and extracts its pixel dimensions.
 *
 * @param file - The file object or an object with an `arrayBuffer` method.
 * @returns A promise resolving to `{ width, height }` in pixels.
 * @throws If the file is not a valid image.
 */
export async function getImageDimensions(
  file: File | { arrayBuffer: () => Promise<ArrayBuffer> },
): Promise<{ width: number; height: number }> {
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer]);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to read image dimensions'));
    img.src = URL.createObjectURL(blob);
  });
}
