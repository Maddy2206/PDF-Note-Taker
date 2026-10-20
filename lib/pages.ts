/**
 * Geometry of the notebook pages on the notes canvas (scene units).
 * Pages are stacked vertically. STRIDE is a multiple of LINE, so ruled lines
 * (every LINE units) line up across pages.
 */
export const LINE = 40;
export const PAGE_W = 800;
export const PAGE_H = 28 * LINE; // 1120
export const PAGE_GAP = LINE;
export const STRIDE = PAGE_H + PAGE_GAP;
/** Where handwritten text starts, and where the red margin line is drawn. */
export const NOTE_X = 56;
export const MARGIN_LINE_X = 44;

export const pageTop = (index: number) => index * STRIDE;

interface Extent {
  y: number;
  height: number;
  isDeleted?: boolean;
}

/** How many pages the content spans (at least 1). */
export function pagesNeeded(elements: readonly Extent[]): number {
  let pages = 1;
  for (const e of elements) {
    if (e.isDeleted) continue;
    pages = Math.max(pages, Math.floor((e.y + e.height - 0.5) / STRIDE) + 1);
  }
  return pages;
}
