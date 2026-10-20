import { exportToCanvas } from "@excalidraw/excalidraw";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { pageHeightInPixels, sliceHeights } from "./page-slices";

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "notes").slice(0, 100);
}

const PADDING = 40;
const LINE_SPACING = 40;

/** Returns false (and writes nothing) if the scene has no elements. */
export async function exportNotesPdf(opts: {
  elements: readonly ExcalidrawElement[];
  files: BinaryFiles;
  paper: "lined" | "blank";
  fileName: string;
}): Promise<boolean> {
  const elements = opts.elements.filter((e) => !e.isDeleted);
  if (elements.length === 0) return false;

  const { jsPDF } = await import("jspdf");
  const src = await exportToCanvas({
    elements,
    files: opts.files,
    appState: { exportBackground: true, viewBackgroundColor: "#ffffff" },
    exportPadding: PADDING,
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  const pagePx = pageHeightInPixels(src.width, contentW, contentH);
  const slices = sliceHeights(src.height, pagePx);
  // Scene y = 40k is a ruled line on screen; find those rows in the exported canvas.
  const minY = Math.min(...elements.map((e) => e.y));
  const lineOffset = (((PADDING - minY) % LINE_SPACING) + LINE_SPACING) % LINE_SPACING;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const mmPerPx = contentW / src.width;

  slices.forEach((s, i) => {
    const page = document.createElement("canvas");
    page.width = src.width;
    page.height = pagePx;
    const ctx = page.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, page.width, page.height);
    if (opts.paper === "lined") {
      ctx.strokeStyle = "rgba(96, 140, 200, 0.45)";
      ctx.lineWidth = 2;
      const first = lineOffset + Math.ceil((s.sy - lineOffset) / LINE_SPACING) * LINE_SPACING;
      for (let y = first; y < s.sy + pagePx; y += LINE_SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y - s.sy);
        ctx.lineTo(page.width, y - s.sy);
        ctx.stroke();
      }
    }
    // The export canvas is opaque white; multiply keeps ruled lines visible under it.
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(src, 0, s.sy, src.width, s.sh, 0, 0, src.width, s.sh);
    ctx.globalCompositeOperation = "source-over";
    if (i > 0) pdf.addPage();
    pdf.addImage(page.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, contentW, pagePx * mmPerPx);
  });

  pdf.save(`${sanitizeFileName(opts.fileName)}.pdf`);
  return true;
}
