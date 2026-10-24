"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDocs,
  getBoard,
  getDocBlob,
  listDocs,
  listHighlights,
  removeDoc,
  saveHighlight,
  updateBoard,
  updateDoc,
} from "@/lib/storage";
import { PAPERS, paperColorOf } from "@/lib/paper";
import PageStyleMenu from "@/components/notes/PageStyleMenu";
import type { Board, Highlight, PdfDoc } from "@/lib/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { HANDWRITING_FONTS, HIGHLIGHT_COLORS, type FontId } from "@/lib/handwriting-fonts";
import dynamic from "next/dynamic";
import PdfViewer, { type PendingSelection } from "@/components/pdf/PdfViewer";
import PdfTabs from "@/components/pdf/PdfTabs";
import SplitLayout from "@/components/workspace/SplitLayout";

// Excalidraw touches `window`, so it only loads in the browser.
const NotesCanvas = dynamic(() => import("@/components/notes/NotesCanvas"), {
  ssr: false,
});

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [loaded, setLoaded] = useState<{ docId: string; blob: Blob } | null>(null);
  const [docs, setDocs] = useState<PdfDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saved");
  // Remember the last color and font (a per-browser convenience, never required).
  const [ink, setInk] = useState(() => {
    try {
      const c = localStorage.getItem("pdfnote.ink");
      if (c && HIGHLIGHT_COLORS.some((x) => x.value === c)) return c;
    } catch {}
    return HIGHLIGHT_COLORS[0].value;
  });
  const [fontId, setFontId] = useState<FontId>(() => {
    try {
      const f = localStorage.getItem("pdfnote.font");
      if (f && HANDWRITING_FONTS.some((x) => x.id === f)) return f;
    } catch {}
    return "caveat";
  });
  function pickInk(c: string) {
    setInk(c);
    try { localStorage.setItem("pdfnote.ink", c); } catch {}
  }
  function pickFont(f: FontId) {
    setFontId(f);
    try { localStorage.setItem("pdfnote.font", f); } catch {}
  }
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
      const list = b ? await listDocs(id) : [];
      if (!b || list.length === 0) {
        setMissing(true);
        return;
      }
      setBoard((await updateBoard(id, { lastOpenedAt: Date.now() })) ?? b);
      setDocs(list);
      setActiveId(list.find((d) => d.id === b.activeDocId)?.id ?? list[0].id);
      setHighlights(await listHighlights(id));
    }
  }, [id]);

  // Load the file of the PDF tab that is open.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getDocBlob(activeId)
      .then((blob) => {
        if (cancelled) return;
        if (blob) setLoaded({ docId: activeId, blob });
        else setNotice("Couldn't find the file for this PDF.");
      })
      .catch(() => !cancelled && setStorageError(true));
    return () => {
      cancelled = true;
    };
  }, [activeId]);

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

  // the file shown is only used while it belongs to the open tab
  const pdf = loaded && loaded.docId === activeId ? loaded.blob : null;
  const activeDoc = docs.find((d) => d.id === activeId) ?? null;

  function patchDoc(docId: string, patch: Partial<PdfDoc>) {
    setDocs((ds) => ds.map((d) => (d.id === docId ? { ...d, ...patch } : d)));
    updateDoc(docId, patch);
  }

  function selectDoc(docId: string) {
    setActiveId(docId);
    save({ activeDocId: docId });
  }

  async function addPdfs(files: File[]) {
    try {
      const added = await addDocs(id, files);
      setDocs((ds) => [...ds, ...added]);
      setBoard((b) => (b ? { ...b, docCount: (b.docCount ?? 1) + added.length } : b));
      selectDoc(added[0].id);
    } catch {
      setNotice("Couldn't save the PDFs. Browser storage may be full or blocked.");
    }
  }

  async function removePdf(docId: string) {
    if (!(await removeDoc(docId))) {
      setNotice("A board needs at least one PDF.");
      return;
    }
    const rest = docs.filter((d) => d.id !== docId);
    setDocs(rest);
    setHighlights((hs) => hs.filter((h) => h.docId !== docId));
    setBoard((b) => (b ? { ...b, docCount: rest.length } : b));
    if (activeId === docId) selectDoc(rest[0].id);
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
      docId: activeId ?? id,
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
        paperColor: board.paperColor,
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
  if (!board || !activeDoc) return <p className="p-6 text-zinc-500">Loading...</p>;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 flex-none items-center gap-2.5 border-b-2 border-[var(--color-divider)] pl-2 pr-3">
        <Link href="/dashboard" aria-label="Back to boards" className="btn btn-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </Link>
        <div className="mr-auto flex min-w-0 flex-col">
          <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.08em] text-[var(--color-accent-700)]">
            {PAPERS.find((x) => x.id === board.paper)?.label} notebook · {docs.length} {docs.length === 1 ? "PDF" : "PDFs"}
          </span>
          <span className="truncate text-[17px] font-extrabold tracking-[-0.01em]">{board.name}</span>
        </div>
        <span
          role="status"
          className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]"
        >
          <span
            aria-hidden
            className={
              saveState === "saving"
                ? "h-2 w-2 bg-[var(--color-neutral-400)]"
                : saveState === "error"
                  ? "h-2 w-2 bg-[var(--color-accent)]"
                  : "text-[var(--color-accent)]"
            }
          >
            {saveState === "saved" ? "✓" : ""}
          </span>
          {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : "Saved"}
        </span>
        <PageStyleMenu
          paper={board.paper}
          color={paperColorOf(board.paper, board.paperColor)}
          onChange={(paper, paperColor) => save({ paper, paperColor })}
        />
        <button
          onClick={downloadPdf}
          disabled={!api || downloading}
          className="btn btn-secondary"
        >
          {downloading ? "Preparing..." : "Download PDF"}
        </button>
        <div className="seg" role="group" aria-label="Layout">
          {(
            [
              ["PDF", { pdf: true, notes: false }],
              ["Split", { pdf: true, notes: true }],
              ["Notes", { pdf: false, notes: true }],
            ] as const
          ).map(([label, v]) => (
            <button
              key={label}
              className="seg-opt"
              aria-pressed={
                board.paneVisibility.pdf === v.pdf && board.paneVisibility.notes === v.notes
              }
              onClick={() => save({ paneVisibility: { ...v } })}
            >
              {label}
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
            <div className="flex h-full flex-col">
              <PdfTabs
                docs={docs}
                activeId={activeDoc.id}
                onSelect={selectDoc}
                onAdd={addPdfs}
                onRename={(docId, name) => patchDoc(docId, { name })}
                onRemove={removePdf}
                onError={setNotice}
              />
              <div className="min-h-0 flex-1">
                {pdf ? (
                  <PdfViewer
                    key={activeDoc.id}
                    blob={pdf}
                    highlights={highlights.filter((h) => h.docId === activeDoc.id)}
                    initialZoom={activeDoc.zoom}
                    onZoomChange={(zoom) => patchDoc(activeDoc.id, { zoom })}
                    onExport={exportToNotes}
                    onImportDiagram={importDiagram}
                    initialPage={activeDoc.lastPage}
                    onPageChange={(lastPage) => patchDoc(activeDoc.id, { lastPage })}
                    onLoaded={(pageCount) => patchDoc(activeDoc.id, { pageCount })}
                    ink={ink}
                    fontId={fontId}
                  />
                ) : (
                  <p className="p-6 text-zinc-500">Loading PDF...</p>
                )}
              </div>
            </div>
          }
          notes={
            <NotesCanvas
              boardId={id}
              onApi={handleApi}
              paper={board.paper}
              paperColor={board.paperColor}
              notePages={board.notePages}
              onNotePagesChange={(notePages) => save({ notePages })}
              onSaveState={setSaveState}
              ink={ink}
              onInk={pickInk}
              fontId={fontId}
              onFont={pickFont}
            />
          }
        />
      </div>
    </div>
  );
}
