// Pure page-slicing math for PDF export. No imports so it can run under node directly.

export type Slice = { sy: number; sh: number };

/**
 * Split a canvas of `totalH` pixels into slices that each fit `pageH` pixels.
 * If the remainder would be shorter than `minTail`, the previous slice is
 * shortened so the last page is never a thin sliver.
 */
export function sliceHeights(totalH: number, pageH: number, minTail = pageH * 0.15): Slice[] {
  if (totalH <= 0 || pageH <= 0) return [];
  const out: Slice[] = [];
  let y = 0;
  while (y < totalH) {
    let h = Math.min(pageH, totalH - y);
    const rest = totalH - y - h;
    if (rest > 0 && rest < minTail) {
      h = Math.max(1, Math.floor(totalH - y - minTail));
    }
    out.push({ sy: y, sh: h });
    y += h;
  }
  return out;
}

/** Page content height in canvas pixels for a canvas of width `canvasW` fitted to contentW x contentH. */
export function pageHeightInPixels(canvasW: number, contentW: number, contentH: number): number {
  return Math.floor((canvasW * contentH) / contentW);
}
