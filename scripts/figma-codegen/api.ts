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
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Figma API authentication failed. Check your FIGMA_ACCESS_TOKEN.',
      );
    }
    if (response.status === 404) {
      throw new Error(
        `Figma node not found: file=${fileKey}, node=${nodeId}`,
      );
    }
    throw new Error(
      `Figma API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<FigmaApiResponse>;
}
