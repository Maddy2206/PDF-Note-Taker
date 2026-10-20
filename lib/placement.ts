export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
}

export const MARGIN = 40;
/** Row height of the notebook: ruled lines on lined paper sit on multiples of this. */
export const LINE = 40;

/**
 * The next free spot for a new note: left margin, on the first ruled line below
 * everything on the canvas, so notes fill the page line by line.
 */
export function nextFreeSpot(elements: readonly Box[]): { x: number; y: number } {
  const live = elements.filter((e) => !e.isDeleted);
  if (live.length === 0) return { x: MARGIN, y: LINE };
  const bottom = Math.max(...live.map((e) => e.y + e.height));
  return { x: MARGIN, y: Math.ceil((bottom - 0.5) / LINE) * LINE };
}
