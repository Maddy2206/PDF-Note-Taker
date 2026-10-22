import { convertToExcalidrawElements, exportToCanvas } from "@excalidraw/excalidraw";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { PAGE_H, PAGE_W, STRIDE } from "./pages";
import { drawPaper, paperColorOf } from "./paper";
import type { Paper } from "./types";

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "notes").slice(0, 100);
}

/** Keep the export canvas under typical browser limits (about 16k px per side). */
const MAX_CANVAS_SIDE = 15000;

/**
 * Writes one PDF page per notebook page. Returns false (and writes nothing) if
 * the notes are empty.
 */
export async function exportNotesPdf(opts: {
  elements: readonly ExcalidrawElement[];
  files: BinaryFiles;
  paper: Paper;
  paperColor?: string;
  pages: number;
  fileName: string;
}): Promise<boolean> {
  const live = opts.elements.filter((e) => !e.isDeleted);
  if (live.length === 0) return false;
  const pages = Math.max(1, opts.pages);

  // Scene area to export: every page, plus anything the learner drew outside them.
  const minX = Math.min(0, ...live.map((e) => e.x));
  const minY = Math.min(0, ...live.map((e) => e.y));
  const maxX = Math.max(PAGE_W, ...live.map((e) => e.x + e.width));
  const maxY = Math.max((pages - 1) * STRIDE + PAGE_H, ...live.map((e) => e.y + e.height));
  const scale = Math.min(2, MAX_CANVAS_SIDE / (maxY - minY), MAX_CANVAS_SIDE / (maxX - minX));

  // Invisible dots in two corners make the export cover that whole area.
  const corners = convertToExcalidrawElements([
    { type: "rectangle", x: minX, y: minY, width: 1, height: 1, strokeColor: "transparent", backgroundColor: "transparent" },
    { type: "rectangle", x: maxX - 1, y: maxY - 1, width: 1, height: 1, strokeColor: "transparent", backgroundColor: "transparent" },
  ]);

  const { jsPDF } = await import("jspdf");
  const src = await exportToCanvas({
    elements: [...corners, ...live],
    files: opts.files,
    appState: { exportBackground: false },
    exportPadding: 0,
    getDimensions: (width: number, height: number) => ({ width: width * scale, height: height * scale, scale }),
  });

  // Canvas pixels per scene unit (measured, so it stays right whatever the library did).
  const k = src.width / (maxX - minX);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfW = 210;
  const pdfH = Math.min(297, (pdfW * PAGE_H) / PAGE_W);

  for (let i = 0; i < pages; i++) {
    const w = Math.round(PAGE_W * k);
    const h = Math.round(PAGE_H * k);
    const page = document.createElement("canvas");
    page.width = w;
    page.height = h;
    const ctx = page.getContext("2d");
    if (!ctx) continue;

    drawPaper(ctx, opts.paper, paperColorOf(opts.paper, opts.paperColor), w, h, k, PAGE_W, PAGE_H);
    ctx.drawImage(src, (0 - minX) * k, (i * STRIDE - minY) * k, w, h, 0, 0, w, h);

    if (i > 0) pdf.addPage();
    pdf.addImage(page.toDataURL("image/jpeg", 0.92), "JPEG", 0, (297 - pdfH) / 2, pdfW, pdfH);
  }

  pdf.save(`${sanitizeFileName(opts.fileName)}.pdf`);
  return true;
}

