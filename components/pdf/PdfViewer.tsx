"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
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

function PageView({ pdf, pageNumber }: { pdf: PDFDocumentProxy; pageNumber: number }) {
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
      <div
        ref={textRef}
        className="textLayer absolute left-0 top-0"
        style={{ width: size.w, height: size.h, ["--total-scale-factor" as string]: SCALE }}
      />
    </div>
  );
}

export default function PdfViewer({
  blob,
  onLoaded,
}: {
  blob: Blob;
  onLoaded?: (pageCount: number) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="h-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-800">
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PageView key={i} pdf={pdf} pageNumber={i + 1} />
      ))}
    </div>
  );
}
