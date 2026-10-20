"use client";

import { useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { regionFromPoints, regionRenderSize, type Region } from "@/lib/diagram-region";

export interface DiagramImage {
  dataURL: string;
  width: number;
  height: number;
}

/** Re-renders just the region (0-1 fractions of the page) at high resolution to a PNG. */
export async function renderRegion(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  region: Region,
): Promise<DiagramImage> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const { scale, width, height } = regionRenderSize(region, base.width, base.height);
  const viewport = page.getViewport({
    scale,
    offsetX: -region.x * base.width * scale,
    offsetY: -region.y * base.height * scale,
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return { dataURL: canvas.toDataURL("image/png"), width, height };
}

const MIN_FRACTION = 0.01;

interface Drag {
  a: { x: number; y: number };
  b: { x: number; y: number };
  w: number;
  h: number;
}

/** Overlay on one page: drag to draw a dotted box, then import or cancel. */
export default function DiagramSelect({
  pdf,
  pageNumber,
  onImport,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  onImport: (img: DiagramImage) => void | Promise<void>;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const box = region ?? (drag ? regionFromPoints(drag.a, drag.b, drag.w, drag.h) : null);

  function local(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }

  return (
    <div
      className="absolute inset-0 z-20 touch-none select-none"
      style={{ cursor: "crosshair" }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-diagram-popout]")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = local(e);
        setRegion(null);
        setAnchor(null);
        setDrag({ a: p, b: p, w: p.w, h: p.h });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        setDrag({ ...drag, b: local(e) });
      }}
      onPointerUp={(e) => {
        if (!drag) return;
        const r = regionFromPoints(drag.a, local(e), drag.w, drag.h);
        setDrag(null);
        if (r.w < MIN_FRACTION || r.h < MIN_FRACTION) return;
        setRegion(r);
        setAnchor({ x: e.clientX, y: e.clientY + 12 });
      }}
    >
      {box && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-indigo-600 bg-indigo-500/10"
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.w * 100}%`,
            height: `${box.h * 100}%`,
          }}
        />
      )}
      {region && anchor && (
        <div
          data-diagram-popout
          role="dialog"
          aria-label="Diagram options"
          style={{
            left: Math.min(Math.max(anchor.x, 110), window.innerWidth - 110),
            top: Math.min(anchor.y, window.innerHeight - 56),
          }}
          className="fixed z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onImport(await renderRegion(pdf, pageNumber, region));
                setRegion(null);
              } catch (err) {
                console.error("renderRegion failed", err);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-md bg-indigo-600 px-2.5 py-1 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Importing..." : "Import to notes"}
          </button>
          <button
            type="button"
            onClick={() => setRegion(null)}
            className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
