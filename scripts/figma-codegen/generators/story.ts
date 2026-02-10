import type { TagNode } from '../types.js';
import { toCamelCase } from '../utils.js';

/**
 * Generate a Storybook `.stories.ts` file from the TagNode IR.
 *
 * Follows the existing project conventions:
 * - `Meta` / `StoryObj` from `@storybook/react-vite`
 * - `satisfies Meta<typeof Component>`
 * - `fn()` for action handlers
 * - `parameters.design` for Figma URL
 */
export function generateStoryCode(
  componentName: string,
  root: TagNode,
  figmaUrl: string,
): string {
  const props = root.props;
  const lines: string[] = [];

  // ── Imports ──
  lines.push(`import type { Meta, StoryObj } from '@storybook/react-vite';`);
  lines.push(`import { fn } from 'storybook/test';`);
  lines.push(`import { ${componentName} } from './${componentName}';`);
  lines.push('');

  // ── Meta ──
  lines.push(`const meta = {`);
  lines.push(`  title: 'Components/${componentName}',`);
  lines.push(`  component: ${componentName},`);
  lines.push(`  parameters: {`);
  lines.push(`    layout: 'centered',`);
  lines.push(`    design: {`);
  lines.push(`      type: 'figma',`);
  lines.push(`      url: '${figmaUrl}',`);
  lines.push(`    },`);
  lines.push(`  },`);
  lines.push(`  tags: ['autodocs'],`);

  // argTypes
  if (props.length > 0) {
    lines.push(`  argTypes: {`);
    for (const prop of props) {
      const propName = toCamelCase(prop.name);
      if (prop.type === 'variant' && prop.options) {
        lines.push(`    ${propName}: {`);
        lines.push(`      control: 'select',`);
        lines.push(
          `      options: [${prop.options.map((o) => `'${o.toLowerCase()}'`).join(', ')}],`,
        );
        lines.push(`    },`);
      } else if (prop.type === 'boolean') {
        lines.push(`    ${propName}: { control: 'boolean' },`);
      } else {
        lines.push(`    ${propName}: { control: 'text' },`);
      }
    }
    lines.push(`  },`);
  }

  // Default args
  lines.push(`  args: {`);
  lines.push(`    onClick: fn(),`);
  for (const prop of props) {
    const propName = toCamelCase(prop.name);
    if (prop.type === 'variant') {
      lines.push(`    ${propName}: '${String(prop.defaultValue).toLowerCase()}',`);
    } else if (prop.type === 'boolean') {
      lines.push(`    ${propName}: ${prop.defaultValue},`);
    } else {
      lines.push(`    ${propName}: '${prop.defaultValue}',`);
    }
  }
  lines.push(`  },`);

  lines.push(`} satisfies Meta<typeof ${componentName}>;`);
  lines.push('');
  lines.push('export default meta;');
  lines.push(`type Story = StoryObj<typeof meta>;`);
  lines.push('');

  // ── Stories from variants ──
  if (root.variants.length > 0) {
    const generatedNames = new Set<string>();

    for (const variant of root.variants) {
      const storyName = variant.name || 'Default';
      if (generatedNames.has(storyName)) continue;
      generatedNames.add(storyName);

      lines.push(`export const ${storyName}: Story = {`);
      lines.push(`  args: {`);
      for (const [key, value] of Object.entries(variant.propValues)) {
        const propName = toCamelCase(key);
        const propDef = props.find((p) => toCamelCase(p.name) === propName);
        if (propDef?.type === 'boolean') {
          lines.push(
            `    ${propName}: ${value === 'true' || value === true},`,
          );
        } else {
          lines.push(`    ${propName}: '${String(value).toLowerCase()}',`);
        }
      }
      lines.push(`  },`);
      lines.push(`};`);
      lines.push('');
    }
  } else {
    lines.push(`export const Default: Story = {};`);
    lines.push('');
  }

  return lines.join('\n');
}
