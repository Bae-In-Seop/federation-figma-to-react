/**
 * GET /api/package/info
 * Get current package metadata
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLatestPackageMetadata } from '../../lib/db.js';
import { getAllComponentsForPackage } from '../../lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const metadata = await getLatestPackageMetadata();
    const components = await getAllComponentsForPackage();
    const packageName = process.env.PACKAGE_NAME || '@federation/ui-components';
    const version = process.env.PACKAGE_VERSION || '1.0.0';

    res.status(200).json({
      packageName,
      version,
      componentCount: components.length,
      lastBuiltAt: metadata?.last_built_at || null,
      tarballUrl: metadata?.tarball_path || null,
      hasComponents: components.length > 0,
    });
  } catch (err) {
    console.error('Error fetching package info:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to fetch package info: ${message}` });
  }
}
