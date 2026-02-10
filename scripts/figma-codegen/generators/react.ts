import type { TagNode, ComponentProp } from '../types.js';
import { toCamelCase } from '../utils.js';

/**
 * Generate a React component `.tsx` file from the TagNode IR.
 */
export function generateReactCode(
  componentName: string,
  root: TagNode,
): string {
  const props = root.props;
  const hasProps = props.length > 0;
  const lines: string[] = [];

  // ── Imports ──
  lines.push(`import React from 'react';`);
  lines.push(`import styles from './${componentName}.module.css';`);
  lines.push('');

  // ── Props interface ──
  if (hasProps) {
    lines.push(`export interface ${componentName}Props {`);
    for (const prop of props) {
      const propName = toCamelCase(prop.name);
      lines.push(`  /** ${prop.name} */`);
      if (prop.type === 'variant' && prop.options) {
        const union = prop.options.map((o) => `'${o.toLowerCase()}'`).join(' | ');
        lines.push(`  ${propName}?: ${union};`);
      } else if (prop.type === 'boolean') {
        lines.push(`  ${propName}?: boolean;`);
      } else {
        lines.push(`  ${propName}?: string;`);
      }
    }
    lines.push(`  /** Optional click handler */`);
    lines.push(`  onClick?: () => void;`);
    lines.push('}');
    lines.push('');
  }

  // ── Component function ──
  const propsType = hasProps
    ? `${componentName}Props`
    : `React.HTMLAttributes<HTMLDivElement>`;

  if (hasProps) {
    const defaultArgs = props.map((p) => {
      const name = toCamelCase(p.name);
      if (p.type === 'variant') {
        return `  ${name} = '${String(p.defaultValue).toLowerCase()}',`;
      } else if (p.type === 'boolean') {
        return `  ${name} = ${p.defaultValue},`;
      } else {
        return `  ${name} = '${p.defaultValue}',`;
      }
    });

    lines.push(`export const ${componentName} = ({`);
    for (const arg of defaultArgs) {
      lines.push(arg);
    }
    lines.push(`  onClick,`);
    lines.push(`  ...props`);
    lines.push(`}: ${propsType}) => {`);
  } else {
    lines.push(
      `export const ${componentName} = (props: ${propsType}) => {`,
    );
  }

  // ── className logic ──
  const classNameParts = ['styles.base'];
  for (const prop of props) {
    if (prop.type === 'variant') {
      const propName = toCamelCase(prop.name);
      classNameParts.push(`styles[${propName}]`);
    } else if (prop.type === 'boolean') {
      const propName = toCamelCase(prop.name);
      classNameParts.push(`${propName} ? styles.${propName} : ''`);
    }
  }

  const classNameExpr =
    classNameParts.length === 1
      ? classNameParts[0]
      : `[${classNameParts.join(', ')}].filter(Boolean).join(' ')`;

  // ── JSX ──
  lines.push(`  return (`);
  lines.push(
    `    <div className={${classNameExpr}}${hasProps ? ' onClick={onClick}' : ''} {...props}>`,
  );
  renderChildren(lines, root, props, 3);
  lines.push(`    </div>`);
  lines.push(`  );`);
  lines.push(`};`);
  lines.push('');

  return lines.join('\n');
}

// ── JSX children ──

function renderChildren(
  lines: string[],
  node: TagNode,
  props: ComponentProp[],
  indent: number,
): void {
  const pad = '  '.repeat(indent);

  for (const child of node.children) {
    if (child.text != null && child.text !== '') {
      // If a TEXT prop exists, render it as a dynamic expression
      const textProp = props.find((p) => p.type === 'text');
      if (textProp) {
        const propName = toCamelCase(textProp.name);
        lines.push(
          `${pad}<span className={styles.${child.className}}>{${propName}}</span>`,
        );
      } else {
        lines.push(
          `${pad}<span className={styles.${child.className}}>${escapeJSX(child.text)}</span>`,
        );
      }
    } else if (child.children.length > 0) {
      lines.push(`${pad}<div className={styles.${child.className}}>`);
      renderChildren(lines, child, props, indent + 1);
      lines.push(`${pad}</div>`);
    } else {
      lines.push(`${pad}<div className={styles.${child.className}} />`);
    }
  }
}

function escapeJSX(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}
