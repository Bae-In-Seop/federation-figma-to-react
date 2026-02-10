/**
 * POST /api/components/save
 * Save a generated component to the database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveComponent } from '../../lib/db.js';

interface SaveRequest {
  componentName: string;
  figmaUrl: string;
  files: {
    react: { filename: string; content: string };
    css: { filename: string; content: string };
    story: { filename: string; content: string };
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { componentName, figmaUrl, files } = req.body as SaveRequest;

    // Validation
    if (!componentName || typeof componentName !== 'string') {
      res.status(400).json({ error: 'Missing or invalid componentName' });
      return;
    }

    if (!figmaUrl || typeof figmaUrl !== 'string') {
      res.status(400).json({ error: 'Missing or invalid figmaUrl' });
      return;
    }

    if (!files?.react?.content || !files?.css?.content || !files?.story?.content) {
      res.status(400).json({ error: 'Missing required file contents' });
      return;
    }

    // Save to database
    const saved = await saveComponent({
      name: componentName,
      figmaUrl,
      componentCode: files.react.content,
      cssCode: files.css.content,
      storyCode: files.story.content,
    });

    res.status(200).json({
      id: saved.id,
      message: `Component "${componentName}" saved successfully`,
    });
  } catch (err) {
    console.error('Error saving component:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to save component: ${message}` });
  }
}
