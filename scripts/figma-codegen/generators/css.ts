import type { TagNode, CSSProperties } from '../types.js';

/**
 * Generate a CSS Module (`.module.css`) file from the TagNode IR.
 */
export function generateCSSCode(root: TagNode): string {
  const lines: string[] = [];

  // ── Base class ──
  lines.push('.base {');
  writeCSSProperties(lines, root.css);
  lines.push('}');

  // ── Variant classes (deduplicated by class name) ──
  const writtenVariants = new Set<string>();

  for (const variant of root.variants) {
    const variantCSS = diffCSS(root.css, variant.node.css);
    if (Object.keys(variantCSS).length === 0) continue;

    for (const value of Object.values(variant.propValues)) {
      const className = String(value).toLowerCase();
      if (writtenVariants.has(className)) continue;
      writtenVariants.add(className);

      lines.push('');
      lines.push(`.${className} {`);
      writeCSSProperties(lines, variantCSS);
      lines.push('}');
    }
  }

  // ── Child element classes ──
  const writtenChildren = new Set<string>();
  generateChildClasses(lines, root, writtenChildren);

  // Also collect child classes from variant nodes
  for (const variant of root.variants) {
    generateChildClasses(lines, variant.node, writtenChildren);
  }

  lines.push('');
  return lines.join('\n');
}

// ── Helpers ──

function generateChildClasses(
  lines: string[],
  node: TagNode,
  seen: Set<string>,
): void {
  for (const child of node.children) {
    if (!seen.has(child.className) && Object.keys(child.css).length > 0) {
      seen.add(child.className);
      lines.push('');
      lines.push(`.${child.className} {`);
      writeCSSProperties(lines, child.css);
      lines.push('}');
    }
    generateChildClasses(lines, child, seen);
  }
}

function writeCSSProperties(lines: string[], css: CSSProperties): void {
  for (const [key, value] of Object.entries(css)) {
    lines.push(`  ${key}: ${value};`);
  }
}

/**
 * Return CSS properties in `variant` that differ from `base`.
 */
function diffCSS(
  base: CSSProperties,
  variant: CSSProperties,
): CSSProperties {
  const diff: CSSProperties = {};
  for (const [key, value] of Object.entries(variant)) {
    if (base[key] !== value) {
      diff[key] = value;
    }
  }
  return diff;
}
