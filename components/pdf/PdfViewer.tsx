"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Highlight, HighlightRect } from "@/lib/types";
import type { FontId } from "@/lib/handwriting-fonts";
import { mostVisiblePage } from "@/lib/visible-page";
import SelectionPopout from "./SelectionPopout";
import DiagramSelect, { type DiagramImage } from "./DiagramSelect";
import "pdfjs-dist/web/pdf_viewer.css";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

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
  scale,
  onClip,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  highlights: Highlight[];
  scale: number;
  onClip?: (img: DiagramImage) => void | Promise<void>;
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
      const vp = page.getViewport({ scale });
      setSize({ w: vp.width, h: vp.height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || rendered.current) return;
        rendered.current = true;
        const pdfjs = await loadPdfjs();
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
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
  }, [pdf, pageNumber, scale]);

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
                opacity: 0.35,
              }}
            />
          )),
        )}
      </div>
      <div
        ref={textRef}
        className="textLayer absolute left-0 top-0"
        style={{ width: size.w, height: size.h, ["--total-scale-factor" as string]: scale }}
      />
      {onClip && <DiagramSelect pdf={pdf} pageNumber={pageNumber} onImport={onClip} />}
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

  // Measure only the text spans inside the selection. range.getClientRects() also
  // returns whole container boxes (e.g. a triple-click can include a page's text layer).
  const pageRects = new Map<HTMLElement, DOMRect[]>();
  container.querySelectorAll<HTMLElement>(".textLayer span").forEach((span) => {
    if (!range.intersectsNode(span)) return;
    const node = span.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const sub = document.createRange();
    sub.selectNodeContents(node);
    if (node === range.startContainer) sub.setStart(node, range.startOffset);
    if (node === range.endContainer) sub.setEnd(node, range.endOffset);
    const rects = Array.from(sub.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
    const pageEl = span.closest<HTMLElement>("[data-page]");
    if (!pageEl || rects.length === 0) return;
    pageRects.set(pageEl, [...(pageRects.get(pageEl) ?? []), ...rects]);
  });
  const pages: PendingSelection["pages"] = [];
  const clientRects: DOMRect[] = [];
  pageRects.forEach((list, pageEl) => {
    const pr = pageEl.getBoundingClientRect();
    const rects: HighlightRect[] = list.map((r) => ({
      x: (r.left - pr.left) / pr.width,
      y: (r.top - pr.top) / pr.height,
      w: r.width / pr.width,
      h: r.height / pr.height,
    }));
    clientRects.push(...list);
    pages.push({ page: Number(pageEl.dataset.page), rects });
  });
  pages.sort((x, y) => x.page - y.page);
  if (pages.length === 0) return null;
  const last = clientRects[clientRects.length - 1];
  return { sel: { text, pages }, x: last.left + last.width / 2, y: last.bottom + 8 };
}

export default function PdfViewer({
  blob,
  highlights = [],
  initialZoom = null,
  onZoomChange,
  onLoaded,
  onExport,
  onImportDiagram,
  initialPage = 1,
  onPageChange,
}: {
  blob: Blob;
  highlights?: Highlight[];
  initialZoom?: number | null;
  onZoomChange?: (zoom: number | null) => void;
  onLoaded?: (pageCount: number) => void;
  onExport?: (sel: PendingSelection, color: string, font: FontId) => void;
  onImportDiagram?: (img: DiagramImage) => void | Promise<void>;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}) {
  const [clipMode, setClipMode] = useState(false);

  useEffect(() => {
    if (!clipMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClipMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clipMode]);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(initialZoom);
  const [fitScale, setFitScale] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const scrollRatio = useRef<number | null>(null);
  const scale = zoom ?? fitScale;
  const [pending, setPending] = useState<{ sel: PendingSelection; x: number; y: number } | null>(null);

  // Width of page 1 at scale 1, used to compute "fit to width".
  useEffect(() => {
    if (!pdf) return;
    pdf.getPage(1).then((p) => setBaseWidth(p.getViewport({ scale: 1 }).width));
  }, [pdf]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !baseWidth) return;
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const fit = (el.clientWidth - 32) / baseWidth;
      setFitScale(Math.round(Math.min(Math.max(fit, MIN_ZOOM), MAX_ZOOM) * 20) / 20);
    };
    update();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    });
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [baseWidth, pdf]);

  // Keep the reading position when the page size changes.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && scrollRatio.current !== null) {
      el.scrollTop = scrollRatio.current * el.scrollHeight;
      scrollRatio.current = null;
    }
  }, [scale]);

  // Resume at the saved page once page heights are known (they settle asynchronously).
  const restored = useRef(false);
  const lastPage = useRef(initialPage);
  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pdf || !baseWidth || restored.current) return;
    restored.current = true;
    let interacted = false;
    const stop = () => {
      interacted = true;
    };
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("mousedown", stop);
    const goto = () => {
      if (interacted) return;
      const target = el.querySelector<HTMLElement>(`[data-page="${initialPage}"]`);
      if (target) {
        el.scrollTop = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16;
      }
    };
    const timers = [0, 100, 250, 500, 900, 1500].map((ms) => setTimeout(goto, ms));
    return () => {
      timers.forEach(clearTimeout);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("mousedown", stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, baseWidth]);

  // Report the most visible page, debounced.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pdf) return;
    let timer: ReturnType<typeof setTimeout>;
    const report = () => {
      const box = el.getBoundingClientRect();
      const rects = Array.from(el.querySelectorAll<HTMLElement>("[data-page]")).map((n) => {
        const r = n.getBoundingClientRect();
        return { page: Number(n.dataset.page), top: r.top, bottom: r.bottom };
      });
      const page = mostVisiblePage(rects, box.top, box.bottom);
      if (page && page !== lastPage.current) {
        lastPage.current = page;
        onPageChangeRef.current?.(page);
      }
    };
    const onScroll = () => {
      if (!restored.current) return;
      clearTimeout(timer);
      timer = setTimeout(report, 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [pdf]);

  function changeZoom(next: number | null) {
    const el = containerRef.current;
    if (el && el.scrollHeight > 0) scrollRatio.current = el.scrollTop / el.scrollHeight;
    const clamped = next === null ? null : Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
    setZoom(clamped);
    setPending(null);
    onZoomChange?.(clamped);
  }

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
    <div className="flex h-full flex-col">
    <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <button
        onClick={() => changeZoom(scale - ZOOM_STEP)}
        aria-label="Zoom out"
        className="rounded px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        &minus;
      </button>
      <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
      <button
        onClick={() => changeZoom(scale + ZOOM_STEP)}
        aria-label="Zoom in"
        className="rounded px-2 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        +
      </button>
      <button
        onClick={() => changeZoom(null)}
        aria-pressed={zoom === null}
        className="ml-1 rounded px-2 py-0.5 hover:bg-zinc-100 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:hover:bg-zinc-800"
      >
        Fit width
      </button>
      {onImportDiagram && (
        <>
          <button
            onClick={() => {
              window.getSelection()?.removeAllRanges();
              setPending(null);
              setClipMode((v) => !v);
            }}
            aria-pressed={clipMode}
            className="ml-3 rounded border border-indigo-300 px-2 py-0.5 font-medium text-indigo-700 hover:bg-indigo-50 aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-zinc-800"
          >
            Clip diagram
          </button>
          {clipMode && (
            <span className="ml-2 text-zinc-600 dark:text-zinc-300">
              Drag a box around the diagram (Esc to exit)
            </span>
          )}
        </>
      )}
    </div>
    <div
      ref={containerRef}
      onMouseUp={handleSelect}
      onScroll={() => pending && setPending(null)}
      className="min-h-0 flex-1 overflow-auto bg-zinc-200 p-4 dark:bg-zinc-800"
    >
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PageView
          key={`${i}-${scale}`}
          pdf={pdf}
          pageNumber={i + 1}
          scale={scale}
          onClip={clipMode ? onImportDiagram : undefined}
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
    </div>
  );
}
