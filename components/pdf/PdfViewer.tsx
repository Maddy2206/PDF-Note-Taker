"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Highlight, HighlightRect } from "@/lib/types";
import type { FontId } from "@/lib/handwriting-fonts";
import SelectionPopout from "./SelectionPopout";
import "pdfjs-dist/web/pdf_viewer.css";

const SCALE = 1.3;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

function PageView({
  pdf,
  pageNumber,
  highlights,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  highlights: Highlight[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 800 });
  const rendered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const vp = page.getViewport({ scale: SCALE });
      setSize({ w: vp.width, h: vp.height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || rendered.current) return;
        rendered.current = true;
        const pdfjs = await loadPdfjs();
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = canvasRef.current;
        const textDiv = textRef.current;
        if (!canvas || !textDiv) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textDiv,
          viewport,
        });
        await textLayer.render();
      },
      { rootMargin: "400px" },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [pdf, pageNumber]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="relative mx-auto mb-4 bg-white shadow"
      style={{ width: size.w, height: size.h }}
    >
      <canvas ref={canvasRef} className="absolute left-0 top-0" />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {highlights.flatMap((h) =>
          h.rects.map((r, i) => (
            <div
              key={`${h.id}-${i}`}
              data-highlight={h.id}
              className="absolute mix-blend-multiply"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                background: h.color,
                opacity: 0.6,
              }}
            />
          )),
        )}
      </div>
      <div
        ref={textRef}
        className="textLayer absolute left-0 top-0"
        style={{ width: size.w, height: size.h, ["--total-scale-factor" as string]: SCALE }}
      />
    </div>
  );
}

export interface PendingSelection {
  text: string;
  pages: { page: number; rects: HighlightRect[] }[];
}

/** Reads the current text selection and converts it to page-relative rectangles. */
function readSelection(container: HTMLElement): { sel: PendingSelection; x: number; y: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;
  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (!text) return null;

  const clientRects = Array.from(range.getClientRects()).filter(
    (r) => r.width > 2 && r.height > 2,
  );
  const pages: PendingSelection["pages"] = [];
  container.querySelectorAll<HTMLElement>("[data-page]").forEach((pageEl) => {
    const pr = pageEl.getBoundingClientRect();
    const rects: HighlightRect[] = [];
    for (const r of clientRects) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx < pr.left || cx > pr.right || cy < pr.top || cy > pr.bottom) continue;
      const rect = {
        x: (r.left - pr.left) / pr.width,
        y: (r.top - pr.top) / pr.height,
        w: r.width / pr.width,
        h: r.height / pr.height,
      };
      const dup = rects.some(
        (o) =>
          Math.abs(o.x - rect.x) < 0.002 &&
          Math.abs(o.y - rect.y) < 0.002 &&
          Math.abs(o.w - rect.w) < 0.002,
      );
      if (!dup) rects.push(rect);
    }
    if (rects.length) pages.push({ page: Number(pageEl.dataset.page), rects });
  });
  if (pages.length === 0) return null;
  const last = clientRects[clientRects.length - 1];
  return { sel: { text, pages }, x: last.left + last.width / 2, y: last.bottom + 8 };
}

export default function PdfViewer({
  blob,
  highlights = [],
  onLoaded,
  onExport,
}: {
  blob: Blob;
  highlights?: Highlight[];
  onLoaded?: (pageCount: number) => void;
  onExport?: (sel: PendingSelection, color: string, font: FontId) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ sel: PendingSelection; x: number; y: number } | null>(null);

  function handleSelect() {
    const container = containerRef.current;
    if (!container) return;
    // let the browser finish updating the selection first
    setTimeout(() => setPending(readSelection(container)), 0);
  }

  function dismiss() {
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }

  useEffect(() => {
    let doc: PDFDocumentProxy | null = null;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const data = new Uint8Array(await blob.arrayBuffer());
        doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        setPdf(doc);
        onLoaded?.(doc.numPages);
      } catch {
        if (!cancelled) setError("Couldn't open this PDF.");
      }
    })();
    return () => {
      cancelled = true;
      doc?.loadingTask.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!pdf) return <p className="p-6 text-zinc-500">Loading PDF...</p>;

  return (
    <div
      ref={containerRef}
      onMouseUp={handleSelect}
      onScroll={() => pending && setPending(null)}
      className="h-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-800"
    >
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PageView
          key={i}
          pdf={pdf}
          pageNumber={i + 1}
          highlights={highlights.filter((h) => h.page === i + 1)}
        />
      ))}
      {pending && (
        <SelectionPopout
          x={pending.x}
          y={pending.y}
          onDismiss={dismiss}
          onExport={(color, font) => {
            onExport?.(pending.sel, color, font);
            dismiss();
          }}
        />
      )}
    </div>
  );
}
