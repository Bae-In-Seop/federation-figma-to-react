// ── Figma API response types ──

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  blendMode?: string;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: string;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  textDecoration?: string;
  textCase?: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];

  // Layout
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  layoutWrap?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  layoutSizingHorizontal?: string;
  layoutSizingVertical?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;

  // Size
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Style
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  opacity?: number;

  // Text
  characters?: string;
  style?: FigmaTypeStyle;

  // Effects
  effects?: FigmaEffect[];

  // Component
  componentPropertyDefinitions?: Record<string, FigmaComponentPropertyDef>;
  componentProperties?: Record<string, FigmaComponentProperty>;
}

export interface FigmaComponentPropertyDef {
  type: 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';
  defaultValue: string | boolean;
  variantOptions?: string[];
}

export interface FigmaComponentProperty {
  type: string;
  value: string | boolean;
}

export interface FigmaApiResponse {
  name: string;
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components: Record<string, { name: string; description: string }>;
      componentSets: Record<string, { name: string; description: string }>;
    }
  >;
}

// ── Intermediate Representation (IR) ──

export interface CSSProperties {
  [key: string]: string | number;
}

export interface ComponentProp {
  name: string;
  type: 'variant' | 'boolean' | 'text';
  defaultValue: string | boolean;
  options?: string[]; // for variant type
}

export interface VariantInfo {
  name: string; // e.g., "LargePrimary"
  propValues: Record<string, string | boolean>;
  node: TagNode;
}

export interface TagNode {
  htmlTag: string;
  className: string;
  css: CSSProperties;
  text?: string;
  children: TagNode[];
  props: ComponentProp[];
  variants: VariantInfo[];
  nodeName: string;
}

// ── Generation result ──

export interface GeneratedComponent {
  componentName: string;
  componentCode: string;
  cssCode: string;
  storyCode: string;
}
