/**
 * POST /api/package/build
 * Build an npm package from all saved components
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllComponentsForPackage,
  savePackageMetadata,
} from '../../lib/db.js';
import { buildPackage } from '../../lib/package-builder.js';
import { uploadTarball, generateTarballFilename } from '../../lib/storage.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get package configuration from environment or use defaults
    const packageName = process.env.PACKAGE_NAME || '@federation/ui-components';
    const version = process.env.PACKAGE_VERSION || '1.0.0';

    // Fetch all components
    const components = await getAllComponentsForPackage();

    if (components.length === 0) {
      res.status(400).json({
        error: 'No components available to build. Please generate and save at least one component.',
      });
      return;
    }

    // Build package
    const { tarballBuffer, buildLog } = await buildPackage({
      components,
      packageName,
      version,
    });

    // Upload tarball to Vercel Blob
    const blobFilename = generateTarballFilename(packageName, version);
    const tarballUrl = await uploadTarball(tarballBuffer, blobFilename);

    // Save metadata to database
    await savePackageMetadata({
      packageName,
      version,
      tarballPath: tarballUrl,
      componentCount: components.length,
    });

    res.status(200).json({
      success: true,
      packageName,
      version,
      tarballUrl,
      tarballFilename: blobFilename,
      componentCount: components.length,
      buildLog,
    });
  } catch (err) {
    console.error('Error building package:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to build package: ${message}` });
  }
}
