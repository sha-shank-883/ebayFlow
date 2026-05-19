import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';
import { createAuditLog } from '../../_audit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  validateFileType,
  validateFileSize,
  generateSafeFilename,
} from '@/lib/upload-validator';
import { optimizeImage, generateThumbnail, getImageMetadata } from '@/lib/image-optimizer';

export const dynamic = 'force-dynamic';

/**
 * POST handler for media upload endpoint.
 *
 * Validates the uploaded file, optimizes it, generates a thumbnail,
 * saves both to disk, and stores metadata in the database.
 *
 * Expected FormData fields:
 * - `file` (required): The image file to upload
 * - `alt` (optional): Alt text for the image
 * - `category` (optional): Category label (e.g. "logo", "banner", "hero")
 */
export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const alt = (formData.get('alt') as string) || '';
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    /** Validate file type against allowed image MIME types. */
    if (!validateFileType(file)) {
      return NextResponse.json(
        {
          message: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    /** Validate file size does not exceed the maximum allowed. */
    if (!validateFileSize(file)) {
      return NextResponse.json(
        { message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 },
      );
    }

    /** Read the raw file buffer for processing. */
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    /** Generate a safe, unique filename preserving the original extension. */
    const safeName = generateSafeFilename(file.name);

    /** Optimize the image: resize to 1920px max, convert to WebP. */
    const optimizedBuffer = await optimizeImage(rawBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 80,
      format: 'webp',
    });

    /** Generate a 200x200 thumbnail from the optimized image. */
    const thumbnailBuffer = await generateThumbnail(optimizedBuffer, 200);

    /** Extract metadata from the optimized image. */
    const metadata = await getImageMetadata(optimizedBuffer);

    /** Ensure the upload and thumbnail directories exist. */
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const thumbDir = join(uploadDir, 'thumbnails');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    if (!existsSync(thumbDir)) {
      await mkdir(thumbDir, { recursive: true });
    }

    /** Save the optimized image with a .webp extension. */
    const optimizedFilename = safeName.replace(/\.\w+$/, '.webp');
    const optimizedPath = join(uploadDir, optimizedFilename);
    await writeFile(optimizedPath, optimizedBuffer);

    /** Save the thumbnail with a _thumb.webp suffix. */
    const thumbFilename = optimizedFilename.replace(/\.webp$/, '_thumb.webp');
    const thumbPath = join(thumbDir, thumbFilename);
    await writeFile(thumbPath, thumbnailBuffer);

    /** Build public URLs for the optimized image and its thumbnail. */
    const url = `/uploads/${optimizedFilename}`;
    const thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;

    /** Store the media asset record in the database. */
    const media = await prisma.mediaAsset.create({
      data: {
        filename: file.name,
        url,
        alt: alt || file.name,
        mimeType: 'image/webp',
        size: optimizedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        category,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'MediaAsset',
      entityId: media.id,
      entityName: file.name,
      changes: { after: media },
    });

    return NextResponse.json(
      {
        ...media,
        thumbnailUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
