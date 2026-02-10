/**
 * GET /api/components
 * List all saved components
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listComponents } from '../lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const components = await listComponents();
    res.status(200).json({ components });
  } catch (err) {
    console.error('Error listing components:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to list components: ${message}` });
  }
}
