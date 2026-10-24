"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Highlight, HighlightRect } from "@/lib/types";
import { getFont, isWhite, type FontId } from "@/lib/handwriting-fonts";
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

/** Old highlights used strong colors; they stay faint, while the newer light markers are drawn fuller. */
function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 190;
}

function PageView({
  pdf,
  pageNumber,
  highlights,
  scale,
  base,
  onClip,
  flash,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  highlights: Highlight[];
  scale: number;
  /** The page's size at scale 1, so its height is right from the first paint. */
  base: { w: number; h: number };
  onClip?: (img: DiagramImage) => void | Promise<void>;
  /** Briefly outlines this area (0-1 page units) after a jump from a note. */
  flash?: HighlightRect;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const size = { w: base.w * scale, h: base.h * scale };
  const rendered = useRef(false);

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
                background: isWhite(h.color) ? "#9ca3af" : h.color,
                opacity: isDark(h.color) ? 0.35 : 0.75,
              }}
            />
          )),
        )}
      </div>
      {flash && (
        <div
          aria-hidden
          className="source-flash pointer-events-none absolute"
          style={{
            left: `${flash.x * 100}%`,
            top: `${flash.y * 100}%`,
            width: `${flash.w * 100}%`,
            height: `${flash.h * 100}%`,
          }}
        />
      )}
      <div
        ref={textRef}
        className="textLayer absolute left-0 top-0"
        style={{ width: size.w, height: size.h, ["--total-scale-factor" as string]: scale }}
      />
      {onClip && <DiagramSelect pdf={pdf} pageNumber={pageNumber} onImport={onClip} />}
    </div>
  );
}

/** A small lazily rendered preview of one page, for the thumbnail strip. */
function Thumb({
  pdf,
  pageNumber,
  base,
  active,
  onPick,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  base: { w: number; h: number };
  active: boolean;
  onPick: () => void;
}) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 104;
  const height = (base.h / base.w) * width;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let done = false;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || done) return;
        done = true;
        const page = await pdf.getPage(pageNumber);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: (width / base.w) * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      },
      { rootMargin: "200px" },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [pdf, pageNumber, base.w]);

  return (
    <button
      ref={wrapRef}
      onClick={onPick}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={active ? "page" : undefined}
      className="mx-auto mb-3 flex flex-col items-center gap-1 p-1 hover:bg-zinc-100 aria-[current=page]:bg-indigo-100"
    >
      <canvas
        ref={canvasRef}
        className="bg-white shadow"
        style={{ width, height }}
      />
      <span className="text-xs tabular-nums">{pageNumber}</span>
    </button>
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
  ink,
  fontId,
  marker,
  onMarker,
  onRemoveHighlight,
  jump,
  onJumpDone,
}: {
  blob: Blob;
  highlights?: Highlight[];
  initialZoom?: number | null;
  onZoomChange?: (zoom: number | null) => void;
  onLoaded?: (pageCount: number) => void;
  onExport?: (sel: PendingSelection, color: string, marker: string, font: FontId) => void;
  onRemoveHighlight?: (highlightId: string) => void;
  /** Scroll to this spot and flash it (a jump from a note to its source). */
  jump?: { page: number; rect: HighlightRect; nonce: number } | null;
  onJumpDone?: () => void;
  /** Light color of the marker drawn over the PDF text. */
  marker: string;
  onMarker: (c: string) => void;
  onImportDiagram?: (img: DiagramImage) => void | Promise<void>;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  /** Note color and handwriting font, picked on the notes toolbar. */
  ink: string;
  fontId: FontId;
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
  const [noText, setNoText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(initialZoom);
  const [fitScale, setFitScale] = useState(1);
  const [sizes, setSizes] = useState<{ w: number; h: number }[] | null>(null);
  const baseWidth = sizes?.[0]?.w ?? 0;
  // Reading position as "which page is at the top, and how far into it".
  const anchor = useRef<{ page: number; frac: number } | null>(null);
  const resumeCancelled = useRef(false);
  const scale = zoom ?? fitScale;
  const [current, setCurrent] = useState(initialPage);
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const [showThumbs, setShowThumbs] = useState(true);
  const [pending, setPending] = useState<{ sel: PendingSelection; x: number; y: number } | null>(null);
  // A click on an existing highlight offers to remove it.
  const [hit, setHit] = useState<{ id: string; x: number; y: number } | null>(null);

  // Every page's size at scale 1: gives "fit to width" and keeps page heights right
  // from the first frame after a zoom (so the reading position can be restored exactly).
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    (async () => {
      const out: { w: number; h: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const vp = (await pdf.getPage(i)).getViewport({ scale: 1 });
        out.push({ w: vp.width, h: vp.height });
      }
      if (!cancelled) setSizes(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf]);

  function captureAnchor() {
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    for (const n of el.querySelectorAll<HTMLElement>("[data-page]")) {
      const r = n.getBoundingClientRect();
      if (r.bottom > top) {
        anchor.current = { page: Number(n.dataset.page), frac: (top - r.top) / r.height };
        return;
      }
    }
  }

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

  // Keep the reading position (same page, same spot in it) when the page size changes.
  useLayoutEffect(() => {
    const el = containerRef.current;
    const a = anchor.current;
    if (!el || !a) return;
    const target = el.querySelector<HTMLElement>(`[data-page="${a.page}"]`);
    if (!target) return;
    const offset =
      target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
    el.scrollTop = offset + a.frac * target.getBoundingClientRect().height;
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
      if (interacted || resumeCancelled.current) return;
      const target = el.querySelector<HTMLElement>(`[data-page="${initialPage}"]`);
      if (target) {
        el.scrollTop = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16;
      }
      updateCurrent();
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

  // Jump from a note: scroll to the exact spot once page sizes are known, then flash it.
  const [flash, setFlash] = useState<{ page: number; rect: HighlightRect } | null>(null);
  const onJumpDoneRef = useRef(onJumpDone);
  useEffect(() => {
    onJumpDoneRef.current = onJumpDone;
  });
  useEffect(() => {
    const el = containerRef.current;
    if (!jump || !el || !pdf || !baseWidth) return;
    resumeCancelled.current = true;
    const goto = () => {
      const target = el.querySelector<HTMLElement>(`[data-page="${jump.page}"]`);
      if (!target) return;
      const box = target.getBoundingClientRect();
      el.scrollTop =
        box.top - el.getBoundingClientRect().top + el.scrollTop + jump.rect.y * box.height - el.clientHeight / 3;
      updateCurrent();
    };
    const timers = [0, 100, 250].map((ms) => setTimeout(goto, ms));
    setFlash({ page: jump.page, rect: jump.rect });
    const done = setTimeout(() => {
      setFlash(null);
      onJumpDoneRef.current?.();
    }, 2200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump?.nonce, pdf, baseWidth]);

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
    let raf = 0;
    const onScroll = () => {
      // remember where the reader is, so a later zoom or resize can keep that spot
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          captureAnchor();
          updateCurrent();
        });
      }
      if (!restored.current) return;
      clearTimeout(timer);
      timer = setTimeout(report, 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
    // The scroll container only exists once the page sizes are known.
  }, [pdf, sizes]);

  function updateCurrent() {
    const el = containerRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const rects = Array.from(el.querySelectorAll<HTMLElement>("[data-page]")).map((n) => {
      const r = n.getBoundingClientRect();
      return { page: Number(n.dataset.page), top: r.top, bottom: r.bottom };
    });
    const page = mostVisiblePage(rects, box.top, box.bottom);
    if (page) setCurrent(page);
  }

  function goToPage(n: number) {
    const el = containerRef.current;
    if (!el || !pdf) return;
    const page = Math.min(Math.max(Math.round(n) || 1, 1), pdf.numPages);
    const target = el.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (!target) return;
    resumeCancelled.current = true;
    el.scrollTop =
      target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16;
    setCurrent(page);
  }

  function fitPage() {
    const el = containerRef.current;
    const b = sizes?.[current - 1] ?? sizes?.[0];
    if (!el || !b) return;
    changeZoom(Math.round(((el.clientHeight - 32) / b.h) * 20) / 20);
  }

  function changeZoom(next: number | null) {
    resumeCancelled.current = true;
    captureAnchor();
    const clamped = next === null ? null : Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
    setZoom(clamped);
    setPending(null);
    onZoomChange?.(clamped);
  }

  function handleSelect(e: React.MouseEvent) {
    const container = containerRef.current;
    if (!container) return;
    const { clientX, clientY } = e;
    // let the browser finish updating the selection first
    setTimeout(() => {
      const sel = readSelection(container);
      setPending(sel);
      setHit(sel ? null : findHighlight(clientX, clientY));
    }, 0);
  }

  function findHighlight(clientX: number, clientY: number) {
    for (const h of highlights) {
      const pageEl = containerRef.current?.querySelector<HTMLElement>(`[data-page="${h.page}"]`);
      if (!pageEl) continue;
      const pr = pageEl.getBoundingClientRect();
      const px = (clientX - pr.left) / pr.width;
      const py = (clientY - pr.top) / pr.height;
      if (h.rects.some((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h)) {
        return { id: h.id, x: clientX, y: clientY + 14 };
      }
    }
    return null;
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
        // A scanned PDF has no text layer, so text highlighting can't work.
        let hasText = false;
        for (let i = 1; i <= Math.min(doc.numPages, 5) && !hasText; i++) {
          const content = await (await doc.getPage(i)).getTextContent();
          hasText = content.items.some((it) => "str" in it && it.str.trim() !== "");
        }
        if (!cancelled) setNoText(!hasText);
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
  if (!pdf || !sizes) return <p className="p-6 text-zinc-500">Loading PDF...</p>;

  return (
    <div className="flex h-full flex-col">
    <div className="flex h-11 shrink-0 items-center gap-x-1 overflow-x-auto whitespace-nowrap border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-2 text-sm [scrollbar-width:none]">
      <button
        onClick={() => setShowThumbs((v) => !v)}
        aria-label="Toggle page thumbnails"
        aria-pressed={showThumbs}
        title="Thumbnails"
        className="btn btn-icon aria-pressed:bg-[var(--color-accent-100)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="3" width="18" height="18" />
          <path d="M9 3v18" />
        </svg>
      </button>
      <span className="mx-1.5 h-5 w-px bg-[var(--color-divider)]" aria-hidden />
      <input
        aria-label="Page number"
        value={pageDraft ?? String(current)}
        inputMode="numeric"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={() => setPageDraft(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            goToPage(Number(pageDraft ?? current));
            setPageDraft(null);
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setPageDraft(null);
            e.currentTarget.blur();
          }
        }}
        className="h-[30px] w-[52px] flex-none border border-[var(--color-divider)] bg-[var(--color-surface)] text-center tabular-nums"
      />
      <span className="tabular-nums text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
        / {pdf.numPages}
      </span>
      <span className="mx-1.5 h-5 w-px bg-[var(--color-divider)]" aria-hidden />
      <button onClick={() => changeZoom(scale - ZOOM_STEP)} aria-label="Zoom out" className="btn btn-icon">
        &minus;
      </button>
      <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
      <button onClick={() => changeZoom(scale + ZOOM_STEP)} aria-label="Zoom in" className="btn btn-icon">
        +
      </button>
      <span className="mx-1.5 h-5 w-px bg-[var(--color-divider)]" aria-hidden />
      <button
        onClick={() => (zoom === null ? fitPage() : changeZoom(null))}
        title={zoom === null ? "Fit whole page in view" : "Fit page to width"}
        className="btn !px-2"
      >
        {zoom === null ? "Fit page" : "Fit width"}
      </button>
      <span className="mx-1.5 h-5 w-px bg-[var(--color-divider)]" aria-hidden />
      <span className="ml-auto" aria-hidden />
      {onImportDiagram && (
        <button
          onClick={() => {
            window.getSelection()?.removeAllRanges();
            setPending(null);
            setClipMode((v) => !v);
          }}
          aria-pressed={clipMode}
          title="Drag a box around a diagram (Esc to exit)"
          className="btn flex-none gap-1.5 !border-2 !border-[var(--color-text)] !px-3 aria-pressed:!border-[var(--color-accent)] aria-pressed:bg-[var(--color-accent)] aria-pressed:text-[var(--color-bg)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="6" cy="6" r="3" />
            <path d="M8.12 8.12 12 12" />
            <path d="M20 4 8.12 15.88" />
            <circle cx="6" cy="18" r="3" />
            <path d="M14.8 14.8 20 20" />
          </svg>
          {clipMode ? "Drag a box… (Esc)" : "Clip diagram"}
        </button>
      )}
    </div>
    {noText && (
      <p role="status" className="shrink-0 bg-amber-100 px-3 py-1.5 text-sm text-amber-900">
        This PDF has no selectable text (it may be a scan), so text highlighting won&apos;t
        work. You can still clip diagrams into your notes.
      </p>
    )}
    <div className="flex min-h-0 flex-1">
    {showThumbs && (
      <nav
        aria-label="Page thumbnails"
        className="w-32 flex-none overflow-y-auto border-r border-[var(--color-divider)] bg-[var(--color-bg)] pt-3"
      >
        {Array.from({ length: pdf.numPages }, (_, i) => (
          <Thumb
            key={i}
            pdf={pdf}
            pageNumber={i + 1}
            base={sizes[i] ?? sizes[0]}
            active={current === i + 1}
            onPick={() => goToPage(i + 1)}
          />
        ))}
      </nav>
    )}
    <div
      ref={containerRef}
      onMouseUp={handleSelect}
      onScroll={() => {
        if (pending) setPending(null);
        if (hit) setHit(null);
      }}
      className="min-h-0 min-w-0 flex-1 overflow-auto bg-zinc-200 p-4"
    >
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PageView
          key={`${i}-${scale}`}
          pdf={pdf}
          pageNumber={i + 1}
          scale={scale}
          base={sizes?.[i] ?? sizes?.[0] ?? { w: 600, h: 800 }}
          onClip={clipMode ? onImportDiagram : undefined}
          highlights={highlights.filter((h) => h.page === i + 1)}
          flash={flash?.page === i + 1 ? flash.rect : undefined}
        />
      ))}
      {hit && !pending && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{
            left: Math.min(Math.max(hit.x, 90), window.innerWidth - 90),
            top: Math.min(hit.y, window.innerHeight - 70),
          }}
          className="fixed z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-base text-black shadow-xl"
          role="dialog"
          aria-label="Highlight actions"
        >
          <button
            type="button"
            onClick={() => {
              onRemoveHighlight?.(hit.id);
              setHit(null);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Remove highlight &amp; note
          </button>
          <button
            type="button"
            onClick={() => setHit(null)}
            aria-label="Dismiss"
            className="px-1.5 text-2xl leading-none text-zinc-500 hover:text-zinc-800"
          >
            &times;
          </button>
        </div>
      )}
      {pending && (
        <SelectionPopout
          x={pending.x}
          y={pending.y}
          color={ink}
          marker={marker}
          onMarker={onMarker}
          fontLabel={getFont(fontId).label}
          fontFamily={getFont(fontId).family}
          onDismiss={dismiss}
          onExport={() => {
            onExport?.(pending.sel, ink, marker, fontId);
            dismiss();
          }}
        />
      )}
    </div>
    </div>
    <div className="flex h-[34px] flex-none items-center gap-3 overflow-hidden whitespace-nowrap border-t border-[var(--color-divider)] px-3 text-xs">
      <span className="font-semibold tabular-nums">
        Page {current} of {pdf.numPages}
      </span>
      <span className="ml-auto h-0.5 w-24 flex-none bg-[var(--color-neutral-300)]" aria-hidden>
        <span
          className="block h-full bg-[var(--color-accent)]"
          style={{ width: `${(current / pdf.numPages) * 100}%` }}
        />
      </span>
    </div>
    </div>
  );
}
