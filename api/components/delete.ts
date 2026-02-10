/**
 * DELETE /api/components/delete?id=<component-id>
 * Delete a component from the database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteComponent } from '../../lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing or invalid component ID' });
    return;
  }

  try {
    const success = await deleteComponent(id);

    if (!success) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Component deleted successfully' });
  } catch (err) {
    console.error('Error deleting component:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to delete component: ${message}` });
  }
}
