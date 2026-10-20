import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/**
 * Makes sure a newly added item is in view without disturbing the page layout:
 * no zoom change, no sideways move, no animation. If it is already visible
 * nothing moves; otherwise only the vertical scroll changes, putting the item
 * near the top of the view.
 */
export function revealElement(
  api: ExcalidrawImperativeAPI,
  el: { y: number; height: number },
) {
  const s = api.getAppState();
  const z = s.zoom.value;
  const top = -s.scrollY;
  const bottom = top + s.height / z;
  const margin = 24 / z;
  if (el.y >= top + margin && el.y + el.height <= bottom - margin) return;
  api.updateScene({ appState: { scrollY: -el.y + 72 / z } as never });
}
