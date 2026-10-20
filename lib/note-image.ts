import { getFont } from "./handwriting-fonts";

const FONT_SIZE = 30;
const LINE_HEIGHT = 1.35;
const MAX_WIDTH = 420;
const PAD = 8;
const PIXEL_RATIO = 2;
const INK = "#1e293b";

export interface RenderedNote {
  dataURL: string;
  /** Size in canvas (CSS) units. */
  width: number;
  height: number;
}

function wrap(ctx: CanvasRenderingContext2D, text: string): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > MAX_WIDTH) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Draws the exact text in a handwriting font, with a marker band in the highlight color. */
export async function renderNoteImage(
  text: string,
  fontId: string,
  color: string,
): Promise<RenderedNote> {
  const font = getFont(fontId);
  const fontSpec = `${FONT_SIZE}px ${font.family}`;
  // Load only the primary family: next/font also lists a local "Fallback" face
  // that can fail on machines without that system font, rejecting the whole load.
  try {
    await document.fonts.load(`${FONT_SIZE}px ${font.family.split(",")[0]}`, text);
  } catch {
    // draw with whatever font is available rather than failing the export
  }

  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = fontSpec;
  const lines = wrap(probe, text);
  const lineH = FONT_SIZE * LINE_HEIGHT;
  const textW = Math.max(...lines.map((l) => probe.measureText(l).width), 10);
  const width = Math.ceil(textW + PAD * 2);
  const height = Math.ceil(lines.length * lineH + PAD * 2);

  const canvas = document.createElement("canvas");
  canvas.width = width * PIXEL_RATIO;
  canvas.height = height * PIXEL_RATIO;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  ctx.font = fontSpec;
  ctx.textBaseline = "alphabetic";

  lines.forEach((line, i) => {
    const y = PAD + i * lineH;
    const w = ctx.measureText(line).width;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.fillRect(PAD - 3, y + lineH * 0.18, w + 6, lineH * 0.7);
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK;
    ctx.fillText(line, PAD, y + lineH * 0.72);
  });

  return { dataURL: canvas.toDataURL("image/png"), width, height };
}
