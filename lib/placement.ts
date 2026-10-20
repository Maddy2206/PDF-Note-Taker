export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
}

export const MARGIN = 40;
export const GAP = 24;

/** The next free spot for a new note: left margin, just below everything on the canvas. */
export function nextFreeSpot(elements: readonly Box[]): { x: number; y: number } {
  const live = elements.filter((e) => !e.isDeleted);
  if (live.length === 0) return { x: MARGIN, y: MARGIN };
  const bottom = Math.max(...live.map((e) => e.y + e.height));
  return { x: MARGIN, y: bottom + GAP };
}
