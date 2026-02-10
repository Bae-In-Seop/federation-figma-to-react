/**
 * Storage wrapper for tarball uploads
 * Uses Vercel Blob in production, local filesystem for development
 */

import { put } from '@vercel/blob';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const useMockStorage = !process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload a tarball to storage
 * Returns the public download URL (Vercel Blob) or local file path (dev)
 */
export async function uploadTarball(
  tarballBuffer: Buffer,
  filename: string,
): Promise<string> {
  if (useMockStorage) {
    // Local development: save to project directory
    const outputDir = join(process.cwd(), 'dist', 'packages');

    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const filePath = join(outputDir, filename);
    writeFileSync(filePath, tarballBuffer);

    // Return a mock URL (in real app, this would be served by the dev server)
    return `/packages/${filename}`;
  }

  // Production: upload to Vercel Blob
  const blob = await put(filename, tarballBuffer, {
    access: 'public',
    contentType: 'application/gzip',
  });

  return blob.url;
}

/**
 * Generate a unique tarball filename
 */
export function generateTarballFilename(
  packageName: string,
  version: string,
): string {
  const timestamp = Date.now();
  const safeName = packageName.replace(/[@/]/g, '-');
  return `${safeName}-${version}-${timestamp}.tgz`;
}
