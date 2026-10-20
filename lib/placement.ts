import { LINE, NOTE_X, PAGE_H, STRIDE } from "./pages";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
}

export { LINE };

/**
 * The next free spot for a new item of the given height: left margin, on the first
 * ruled line below everything on the canvas. If the item would run past the bottom
 * margin of a page it starts at the top of the next page instead.
 */
export function nextFreeSpot(
  elements: readonly Box[],
  height: number = LINE,
): { x: number; y: number } {
  const live = elements.filter((e) => !e.isDeleted);
  let y = LINE;
  if (live.length > 0) {
    const bottom = Math.max(...live.map((e) => e.y + e.height));
    y = Math.ceil((bottom - 0.5) / LINE) * LINE;
  }
  const page = Math.floor(y / STRIDE);
  const top = page * STRIDE;
  const usableBottom = top + PAGE_H - LINE; // keep one empty row at the bottom
  if (y > top + LINE && y + height > usableBottom) y = (page + 1) * STRIDE + LINE;
  if (y < top + LINE) y = top + LINE;
  return { x: NOTE_X, y };
}
