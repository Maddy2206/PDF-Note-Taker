export interface PageRect {
  page: number;
  top: number;
  bottom: number;
}

/** Page with the most pixels inside [viewTop, viewBottom]; ties go to the lower page number. */
export function mostVisiblePage(
  rects: PageRect[],
  viewTop: number,
  viewBottom: number,
): number | null {
  let best: number | null = null;
  let bestVisible = 0;
  for (const r of rects) {
    const visible = Math.min(r.bottom, viewBottom) - Math.max(r.top, viewTop);
    if (visible > bestVisible) {
      best = r.page;
      bestVisible = visible;
    }
  }
  return best;
}
