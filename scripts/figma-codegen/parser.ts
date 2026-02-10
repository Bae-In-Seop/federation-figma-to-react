import type {
  FigmaNode,
  TagNode,
  ComponentProp,
  VariantInfo,
} from './types.js';
import { mapNodeToCSS } from './mappers.js';
import { sanitizeClassName, toPascalCase } from './utils.js';

const SKIP_TYPES = new Set([
  'VECTOR',
  'BOOLEAN_OPERATION',
  'SLICE',
  'GROUP',
]);

/**
 * Parse a Figma node tree into a TagNode intermediate representation.
 *
 * If the root is a `COMPONENT_SET` (i.e. it has variants), all variant
 * information is extracted and attached to the returned TagNode.
 */
export function parseFigmaTree(rootNode: FigmaNode): TagNode {
  if (rootNode.type === 'COMPONENT_SET') {
    return parseComponentSet(rootNode);
  }
  return parseNode(rootNode);
}

// ── COMPONENT_SET handling ──

function parseComponentSet(node: FigmaNode): TagNode {
  const props = extractComponentProps(node);
  const variants: VariantInfo[] = [];

  const children = node.children ?? [];
  let baseNode: TagNode | null = null;

  for (const child of children) {
    if (child.type !== 'COMPONENT' || child.visible === false) continue;

    const variantProps = parseVariantName(child.name);
    const parsed = parseNode(child);

    variants.push({
      name: buildVariantStoryName(variantProps),
      propValues: variantProps,
      node: parsed,
    });

    if (!baseNode) {
      baseNode = parsed;
    }
  }

  if (!baseNode) {
    baseNode = parseNode(node);
  }

  return {
    ...baseNode,
    props,
    variants,
    nodeName: node.name,
  };
}

// ── Single-node parsing ──

function parseNode(node: FigmaNode): TagNode {
  // Text leaf
  if (node.type === 'TEXT') {
    return {
      htmlTag: 'span',
      className: sanitizeClassName(node.name),
      css: mapNodeToCSS(node, true),
      text: node.characters ?? '',
      children: [],
      props: [],
      variants: [],
      nodeName: node.name,
    };
  }

  // Container (COMPONENT, FRAME, RECTANGLE, ELLIPSE, INSTANCE, …)
  const children: TagNode[] = [];

  for (const child of node.children ?? []) {
    if (child.visible === false) continue;
    if (SKIP_TYPES.has(child.type)) continue;
    children.push(parseNode(child));
  }

  return {
    htmlTag: 'div',
    className: sanitizeClassName(node.name),
    css: mapNodeToCSS(node),
    children,
    props: [],
    variants: [],
    nodeName: node.name,
  };
}

// ── Component property extraction ──

function extractComponentProps(node: FigmaNode): ComponentProp[] {
  const defs = node.componentPropertyDefinitions;
  if (!defs) return [];

  const props: ComponentProp[] = [];

  for (const [key, def] of Object.entries(defs)) {
    // Figma property key format: "Property Name#hash"
    const propName = key.split('#')[0];

    if (def.type === 'VARIANT') {
      props.push({
        name: propName,
        type: 'variant',
        defaultValue: String(def.defaultValue),
        options: def.variantOptions,
      });
    } else if (def.type === 'BOOLEAN') {
      props.push({
        name: propName,
        type: 'boolean',
        defaultValue: def.defaultValue,
      });
    } else if (def.type === 'TEXT') {
      props.push({
        name: propName,
        type: 'text',
        defaultValue: String(def.defaultValue),
      });
    }
  }

  return props;
}

// ── Variant name helpers ──

/**
 * Parse a Figma variant name like `"Size=Large, Variant=Primary"` into
 * `{ Size: "Large", Variant: "Primary" }`.
 */
function parseVariantName(name: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = name.split(',').map((s) => s.trim());

  for (const part of parts) {
    const [key, value] = part.split('=').map((s) => s.trim());
    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Build a story export name from variant prop values.
 * e.g. `{ Size: "Large", Variant: "Primary" }` → `"LargePrimary"`
 */
function buildVariantStoryName(props: Record<string, string>): string {
  return Object.values(props)
    .map((v) => toPascalCase(v))
    .join('');
}
