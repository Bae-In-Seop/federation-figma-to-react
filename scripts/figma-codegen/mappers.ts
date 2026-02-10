import type { CSSProperties, FigmaNode, FigmaPaint, FigmaEffect } from './types.js';
import { figmaColorToCSS } from './utils.js';

// ── Layout ──

export function mapLayout(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    css.display = 'flex';
    css['flex-direction'] = node.layoutMode === 'VERTICAL' ? 'column' : 'row';

    if (node.layoutWrap === 'WRAP') {
      css['flex-wrap'] = 'wrap';
    }
  }

  return css;
}

// ── Alignment ──

export function mapAlignment(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.primaryAxisAlignItems) {
    const map: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      SPACE_BETWEEN: 'space-between',
    };
    if (map[node.primaryAxisAlignItems]) {
      css['justify-content'] = map[node.primaryAxisAlignItems];
    }
  }

  if (node.counterAxisAlignItems) {
    const map: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      BASELINE: 'baseline',
    };
    if (map[node.counterAxisAlignItems]) {
      css['align-items'] = map[node.counterAxisAlignItems];
    }
  }

  return css;
}

// ── Spacing / Padding ──

export function mapSpacing(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.itemSpacing != null && node.itemSpacing > 0) {
    css.gap = `${node.itemSpacing}px`;
  }

  const pt = node.paddingTop ?? 0;
  const pr = node.paddingRight ?? 0;
  const pb = node.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? 0;

  if (pt || pr || pb || pl) {
    if (pt === pr && pr === pb && pb === pl) {
      css.padding = `${pt}px`;
    } else if (pt === pb && pl === pr) {
      css.padding = `${pt}px ${pr}px`;
    } else {
      css.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
    }
  }

  return css;
}

// ── Size ──

export function mapSize(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.layoutSizingHorizontal === 'FIXED' && node.absoluteBoundingBox) {
    css.width = `${node.absoluteBoundingBox.width}px`;
  } else if (node.layoutSizingHorizontal === 'FILL') {
    css.width = '100%';
  }

  if (node.layoutSizingVertical === 'FIXED' && node.absoluteBoundingBox) {
    css.height = `${node.absoluteBoundingBox.height}px`;
  } else if (node.layoutSizingVertical === 'FILL') {
    css.height = '100%';
  }

  return css;
}

// ── Fills (background) ──

export function mapFills(fills?: FigmaPaint[]): CSSProperties {
  const css: CSSProperties = {};
  if (!fills?.length) return css;

  const visibleFill = fills.find(
    (f) => f.visible !== false && f.type === 'SOLID' && f.color,
  );
  if (visibleFill?.color) {
    const color = {
      ...visibleFill.color,
      a: visibleFill.opacity ?? visibleFill.color.a,
    };
    css['background-color'] = figmaColorToCSS(color);
  }

  return css;
}

// ── Text color ──

export function mapTextColor(fills?: FigmaPaint[]): CSSProperties {
  const css: CSSProperties = {};
  if (!fills?.length) return css;

  const visibleFill = fills.find(
    (f) => f.visible !== false && f.type === 'SOLID' && f.color,
  );
  if (visibleFill?.color) {
    const color = {
      ...visibleFill.color,
      a: visibleFill.opacity ?? visibleFill.color.a,
    };
    css.color = figmaColorToCSS(color);
  }

  return css;
}

// ── Border ──

export function mapBorder(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.strokes?.length && node.strokeWeight) {
    const visibleStroke = node.strokes.find(
      (s) => s.visible !== false && s.type === 'SOLID' && s.color,
    );
    if (visibleStroke?.color) {
      const color = figmaColorToCSS(visibleStroke.color);
      css.border = `${node.strokeWeight}px solid ${color}`;
    }
  }

  return css;
}

// ── Corner radius ──

export function mapCornerRadius(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};

  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl === tr && tr === br && br === bl) {
      if (tl > 0) css['border-radius'] = `${tl}px`;
    } else {
      css['border-radius'] = `${tl}px ${tr}px ${br}px ${bl}px`;
    }
  } else if (node.cornerRadius && node.cornerRadius > 0) {
    css['border-radius'] = `${node.cornerRadius}px`;
  }

  return css;
}

// ── Text style ──

export function mapTextStyle(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};
  const s = node.style;
  if (!s) return css;

  if (s.fontFamily) css['font-family'] = `'${s.fontFamily}', sans-serif`;
  if (s.fontSize) css['font-size'] = `${s.fontSize}px`;
  if (s.fontWeight) css['font-weight'] = s.fontWeight;

  if (s.lineHeightPx && s.fontSize) {
    css['line-height'] = `${Math.round((s.lineHeightPx / s.fontSize) * 100) / 100}`;
  }
  if (s.letterSpacing) {
    css['letter-spacing'] = `${Math.round(s.letterSpacing * 100) / 100}px`;
  }

  if (s.textAlignHorizontal) {
    const map: Record<string, string> = {
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      JUSTIFIED: 'justify',
    };
    if (map[s.textAlignHorizontal]) {
      css['text-align'] = map[s.textAlignHorizontal];
    }
  }

  return css;
}

// ── Effects (shadows) ──

export function mapEffects(effects?: FigmaEffect[]): CSSProperties {
  const css: CSSProperties = {};
  if (!effects?.length) return css;

  const shadows = effects.filter(
    (e) => e.visible !== false && e.type === 'DROP_SHADOW' && e.color,
  );

  if (shadows.length > 0) {
    css['box-shadow'] = shadows
      .map((s) => {
        const x = s.offset?.x ?? 0;
        const y = s.offset?.y ?? 0;
        const blur = s.radius ?? 0;
        const spread = s.spread ?? 0;
        const color = figmaColorToCSS(s.color!);
        return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
      })
      .join(', ');
  }

  return css;
}

// ── Opacity ──

export function mapOpacity(node: FigmaNode): CSSProperties {
  const css: CSSProperties = {};
  if (node.opacity != null && node.opacity < 1) {
    css.opacity = Math.round(node.opacity * 100) / 100;
  }
  return css;
}

// ── Aggregate mapper ──

/**
 * Collect all CSS properties for a given Figma node.
 * When `isText` is true the node fills map to `color` (not `background-color`)
 * and font style properties are extracted.
 */
export function mapNodeToCSS(
  node: FigmaNode,
  isText: boolean = false,
): CSSProperties {
  return {
    ...mapLayout(node),
    ...mapAlignment(node),
    ...mapSpacing(node),
    ...mapSize(node),
    ...(isText ? mapTextColor(node.fills) : mapFills(node.fills)),
    ...mapBorder(node),
    ...mapCornerRadius(node),
    ...(isText ? mapTextStyle(node) : {}),
    ...mapEffects(node.effects),
    ...mapOpacity(node),
  };
}
