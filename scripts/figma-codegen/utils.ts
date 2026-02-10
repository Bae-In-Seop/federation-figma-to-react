/**
 * Convert a name to PascalCase for component names.
 */
export function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a name to camelCase for variable/prop names.
 */
export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert a name to kebab-case for CSS class names.
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .join('-');
}

/**
 * Convert Figma RGBA (0–1 range) to a CSS color string.
 */
export function figmaColorToCSS(color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 100) / 100;

  if (a === 1) {
    return rgbToHex(r, g, b);
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `#${hex}`;
}

/**
 * Parse a Figma URL to extract file key and node ID.
 *
 * Supports both `/design/` and `/file/` URL formats.
 */
export function parseFigmaUrl(
  url: string,
): { fileKey: string; nodeId: string } | null {
  const match = url.match(/figma\.com\/(design|file)\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  const fileKey = match[2];

  const urlObj = new URL(url);
  const nodeIdParam = urlObj.searchParams.get('node-id');
  if (!nodeIdParam) return null;

  return { fileKey, nodeId: nodeIdParam };
}

/**
 * Sanitize a node name into a valid CSS class / JS identifier segment.
 */
export function sanitizeClassName(name: string): string {
  return toCamelCase(name) || 'element';
}
