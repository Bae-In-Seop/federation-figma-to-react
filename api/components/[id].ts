/**
 * GET /api/components/[id]
 * Get a single component by ID with full code content
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getComponentById } from '../../lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing or invalid component ID' });
    return;
  }

  try {
    const component = await getComponentById(id);

    if (!component) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    // Transform to match frontend CodegenResult format
    res.status(200).json({
      id: component.id,
      name: component.name,
      figmaUrl: component.figma_url,
      files: {
        react: {
          filename: `${component.name}.tsx`,
          content: component.component_code,
        },
        css: {
          filename: `${component.name}.module.css`,
          content: component.css_code,
        },
        story: {
          filename: `${component.name}.stories.ts`,
          content: component.story_code,
        },
      },
      createdAt: component.created_at,
      updatedAt: component.updated_at,
    });
  } catch (err) {
    console.error('Error fetching component:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to fetch component: ${message}` });
  }
}
