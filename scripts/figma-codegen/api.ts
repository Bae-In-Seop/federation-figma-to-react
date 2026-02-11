import type { FigmaApiResponse } from './types.js';

/**
 * Fetch a Figma node (and its subtree) via the REST API.
 *
 * Uses `GET /v1/files/:file_key/nodes?ids=:node_ids` with
 * the personal access token passed in the `X-Figma-Token` header.
 */
export async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  token: string,
): Promise<FigmaApiResponse> {
  // Figma API expects node IDs with `:` separator (e.g. "11:4"),
  // but URLs use `-` separator (e.g. "11-4").
  const formattedNodeId = nodeId.replace('-', ':');

  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(formattedNodeId)}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });

  if (!response.ok) {
    // Try to get detailed error message from response body
    let errorDetail = '';
    try {
      const errorBody = await response.json() as any;
      errorDetail = errorBody.message || errorBody.error || JSON.stringify(errorBody);
    } catch {
      errorDetail = await response.text().catch(() => 'No error details available');
    }

    console.error(`Figma API Error ${response.status}:`, errorDetail);

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Figma API authentication failed. Check your FIGMA_ACCESS_TOKEN. Details: ${errorDetail}`,
      );
    }
    if (response.status === 404) {
      throw new Error(
        `Figma node not found: file=${fileKey}, node=${nodeId}. Details: ${errorDetail}`,
      );
    }
    if (response.status === 429) {
      throw new Error(
        `Figma API rate limit exceeded. Details: ${errorDetail}. Please wait and try again.`,
      );
    }
    throw new Error(
      `Figma API error: ${response.status} ${response.statusText}. Details: ${errorDetail}`,
    );
  }

  return response.json() as Promise<FigmaApiResponse>;
}
