export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/** Two points in page-pixel space -> region as 0-1 fractions, clamped to the page. */
export function regionFromPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  pageW: number,
  pageH: number,
): Region {
  const x1 = clamp01(Math.min(a.x, b.x) / pageW);
  const x2 = clamp01(Math.max(a.x, b.x) / pageW);
  const y1 = clamp01(Math.min(a.y, b.y) / pageH);
  const y2 = clamp01(Math.max(a.y, b.y) / pageH);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Render scale and output pixel size for a region of a page (size at scale 1). */
export function regionRenderSize(
  region: Region,
  pageW1: number,
  pageH1: number,
  targetScale = 3,
  maxEdge = 2400,
) {
  const long1 = Math.max(region.w * pageW1, region.h * pageH1);
  const scale = Math.min(targetScale, maxEdge / Math.max(long1, 1));
  return {
    scale,
    width: Math.max(1, Math.round(region.w * pageW1 * scale)),
    height: Math.max(1, Math.round(region.h * pageH1 * scale)),
  };
}

/** Size an image to at most maxW canvas units wide, keeping its aspect ratio. */
export function fitWidth(width: number, height: number, maxW = 420) {
  const k = Math.min(1, maxW / width);
  return { width: width * k, height: height * k };
}
