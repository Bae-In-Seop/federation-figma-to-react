import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runCodegen } from '../scripts/figma-codegen/codegen.js';
import { saveComponent, trackComponentGeneration } from '../lib/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server misconfigured: missing Figma token' });
    return;
  }

  const { figmaUrl, save } = req.body;
  if (!figmaUrl || typeof figmaUrl !== 'string') {
    res.status(400).json({ error: 'Missing or invalid figmaUrl in request body' });
    return;
  }

  try {
    const result = await runCodegen(figmaUrl, token);

    // Track generation for analytics
    try {
      await trackComponentGeneration(result.componentName, figmaUrl);
    } catch (analyticsErr) {
      console.warn('Failed to track generation:', analyticsErr);
      // Don't fail the request if analytics fails
    }

    // Optionally save to database
    if (save === true) {
      try {
        await saveComponent({
          name: result.componentName,
          figmaUrl,
          componentCode: result.files.react.content,
          cssCode: result.files.css.content,
          storyCode: result.files.story.content,
        });
      } catch (saveErr) {
        console.error('Failed to save component:', saveErr);
        // Return the generated code even if save fails
        return res.status(200).json({
          ...result,
          saveWarning: 'Code generated but failed to save to library',
        });
      }
    }

    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('Invalid Figma URL')) {
      res.status(400).json({ error: message });
    } else if (message.includes('401') || message.includes('403')) {
      res.status(401).json({ error: 'Figma authentication failed' });
    } else {
      res.status(500).json({ error: message });
    }
  }
}
