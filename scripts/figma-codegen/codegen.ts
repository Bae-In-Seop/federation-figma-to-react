import { fetchFigmaNode } from './api.js';
import { parseFigmaTree } from './parser.js';
import { generateReactCode } from './generators/react.js';
import { generateCSSCode } from './generators/css.js';
import { generateStoryCode } from './generators/story.js';
import { parseFigmaUrl, toPascalCase } from './utils.js';

export interface CodegenResult {
  componentName: string;
  files: {
    react: { filename: string; content: string };
    css: { filename: string; content: string };
    story: { filename: string; content: string };
  };
}

export async function runCodegen(
  figmaUrl: string,
  token: string,
): Promise<CodegenResult> {
  const parsed = parseFigmaUrl(figmaUrl);
  if (!parsed) {
    throw new Error(
      'Invalid Figma URL. Expected format: https://www.figma.com/design/<file-key>/...?node-id=<node-id>',
    );
  }

  const { fileKey, nodeId } = parsed;
  const response = await fetchFigmaNode(fileKey, nodeId, token);

  const nodeKey = Object.keys(response.nodes)[0];
  if (!nodeKey) {
    throw new Error('No nodes returned from Figma API.');
  }

  const rootNode = response.nodes[nodeKey].document;
  const componentName = toPascalCase(rootNode.name);
  const ir = parseFigmaTree(rootNode);

  const reactContent = generateReactCode(componentName, ir);
  const cssContent = generateCSSCode(ir);
  const storyContent = generateStoryCode(componentName, ir, figmaUrl);

  return {
    componentName,
    files: {
      react: {
        filename: `${componentName}.tsx`,
        content: reactContent,
      },
      css: {
        filename: `${componentName}.module.css`,
        content: cssContent,
      },
      story: {
        filename: `${componentName}.stories.ts`,
        content: storyContent,
      },
    },
  };
}
