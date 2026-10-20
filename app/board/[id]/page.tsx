"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getBoard,
  getPdf,
  listHighlights,
  saveHighlight,
  updateBoard,
} from "@/lib/storage";
import type { Board, Highlight, PaneVisibility } from "@/lib/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { FontId } from "@/lib/handwriting-fonts";
import dynamic from "next/dynamic";
import PdfViewer, { type PendingSelection } from "@/components/pdf/PdfViewer";
import SplitLayout from "@/components/workspace/SplitLayout";

// Excalidraw touches `window`, so it only loads in the browser.
const NotesCanvas = dynamic(() => import("@/components/notes/NotesCanvas"), {
  ssr: false,
});

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [missing, setMissing] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const handleApi = useCallback((a: ExcalidrawImperativeAPI) => setApi(a), []);

  useEffect(() => {
    (async () => {
      try {
        await loadBoard();
      } catch {
        setStorageError(true);
      }
    })();
    async function loadBoard() {
      const b = await getBoard(id);
      const blob = await getPdf(id);
      if (!b || !blob) {
        setMissing(true);
        return;
      }
      setBoard((await updateBoard(id, { lastOpenedAt: Date.now() })) ?? b);
      setPdf(blob);
      setHighlights(await listHighlights(id));
    }
  }, [id]);

  // Ctrl+Z / Ctrl+Y undo and redo the notes even when focus is on the PDF side.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (!mod || e.altKey || (k !== "z" && k !== "y")) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest(".excalidraw, input, textarea, select, [contenteditable]")) return;
      const canvas = document.querySelector(".excalidraw");
      if (!canvas) return;
      e.preventDefault();
      canvas.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function save(patch: Partial<Board>) {
    setBoard((b) => (b ? { ...b, ...patch } : b));
    updateBoard(id, patch);
  }

  async function exportToNotes(sel: PendingSelection, color: string, font: FontId) {
    if (!api) {
      setNotice("The notes aren't ready yet. Try again in a moment.");
      return;
    }
    const { addHandwrittenNote } = await import("@/components/notes/handwritten");
    const created: Highlight[] = sel.pages.map((p) => ({
      id: crypto.randomUUID(),
      boardId: id,
      page: p.page,
      rects: p.rects,
      color,
      text: sel.text,
      font,
    }));
    await Promise.all(created.map(saveHighlight));
    setHighlights((prev) => [...prev, ...created]);
    try {
      await addHandwrittenNote(api, { text: sel.text, font, color });
    } catch (e) {
      console.error("addHandwrittenNote failed", e);
      setNotice("Couldn't add the note to the board. Please try again.");
      return;
    }
    if (!board?.paneVisibility.notes) save({ paneVisibility: { pdf: true, notes: true } });
  }

  async function importDiagram(img: { dataURL: string; width: number; height: number }) {
    if (!api) {
      setNotice("The notes aren't ready yet. Try again in a moment.");
      return;
    }
    try {
      const { addDiagramImage } = await import("@/components/notes/diagram");
      addDiagramImage(api, img);
    } catch (e) {
      console.error("addDiagramImage failed", e);
      setNotice("Couldn't add the diagram to the board. Please try again.");
      return;
    }
    if (!board?.paneVisibility.notes) save({ paneVisibility: { pdf: true, notes: true } });
  }

  async function downloadPdf() {
    if (!api || !board || downloading) return;
    setDownloading(true);
    try {
      const { exportNotesPdf } = await import("@/lib/export-pdf");
      const ok = await exportNotesPdf({
        elements: api.getSceneElements(),
        files: api.getFiles(),
        paper: board.paper,
        pages: board.notePages ?? 1,
        fileName: board.name,
      });
      if (!ok) setNotice("Nothing to download yet. Add some notes first.");
    } catch (e) {
      console.error("exportNotesPdf failed", e);
      setNotice("Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  function toggle(key: keyof PaneVisibility) {
    if (!board) return;
    const next = { ...board.paneVisibility, [key]: !board.paneVisibility[key] };
    if (!next.pdf && !next.notes) return; // keep at least one pane open
    save({ paneVisibility: next });
  }

  if (storageError) {
    return (
      <main className="p-6">
        <p role="alert" className="mb-2">
          Couldn&apos;t open browser storage, so this board can&apos;t be loaded.
        </p>
        <Link href="/dashboard" className="text-indigo-600 underline">
          Back to your boards
        </Link>
      </main>
    );
  }
  if (missing) {
    return (
      <main className="p-6">
        <p className="mb-2">This board doesn&apos;t exist in this browser.</p>
        <Link href="/dashboard" className="text-indigo-600 underline">
          Back to your boards
        </Link>
      </main>
    );
  }
  if (!board || !pdf) return <p className="p-6 text-zinc-500">Loading...</p>;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          &larr; Boards
        </Link>
        <h1 className="truncate font-medium">{board.name}</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            onClick={downloadPdf}
            disabled={!api || downloading}
            className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {downloading ? "Preparing..." : "Download PDF"}
          </button>
          {(["pdf", "notes"] as const).map((key) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              aria-pressed={board.paneVisibility[key]}
              className="rounded-md border border-zinc-300 px-2.5 py-1 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:border-zinc-700"
            >
              {key === "pdf" ? "PDF" : "Notes"}
            </button>
          ))}
        </div>
      </header>
      {notice && (
        <p role="status" className="bg-amber-100 px-4 py-1 text-sm text-amber-900">
          {notice}{" "}
          <button onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </p>
      )}
      <div className="min-h-0 flex-1">
        <SplitLayout
          ratio={board.dividerRatio}
          visibility={board.paneVisibility}
          onRatioChange={(dividerRatio) => save({ dividerRatio })}
          onVisibilityChange={(paneVisibility) => save({ paneVisibility })}
          pdf={
            <PdfViewer
              blob={pdf}
              highlights={highlights}
              initialZoom={board.pdfZoom ?? null}
              onZoomChange={(pdfZoom) => updateBoard(id, { pdfZoom })}
              onExport={exportToNotes}
              onImportDiagram={importDiagram}
              initialPage={board.lastPage}
              onPageChange={(lastPage) => updateBoard(id, { lastPage })}
              onLoaded={(pageCount) => updateBoard(id, { pageCount })}
            />
          }
          notes={
            <NotesCanvas
              boardId={id}
              onApi={handleApi}
              paper={board.paper}
              notePages={board.notePages}
              onNotePagesChange={(notePages) => save({ notePages })}
            />
          }
        />
      </div>
    </div>
  );
}
