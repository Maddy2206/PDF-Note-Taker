"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { loadScene, saveScene } from "@/lib/storage";
import { PAGE_W, STRIDE, pageTop, pagesNeeded } from "@/lib/pages";
import PaperBackground, { type PaperView } from "./PaperBackground";
import InlineNoteEditor from "./InlineNoteEditor";
import {
  getNoteMeta,
  removeNote,
  setNoteHidden,
  updateHandwrittenNote,
  type NoteMeta,
} from "./handwritten";
import type { Paper, SceneRecord } from "@/lib/types";

const SAVE_DELAY_MS = 800;

/** Zoom and scroll that show notebook page `index` centered, fitted to the pane width. */
function viewForPage(width: number, index: number): PaperView {
  const zoom = Math.min(Math.max((width - 48) / PAGE_W, 0.25), 1.5);
  return { zoom, scrollX: (width / zoom - PAGE_W) / 2, scrollY: 24 / zoom - pageTop(index) };
}

export default function NotesCanvas({
  boardId,
  onApi,
  paper,
  notePages,
  onNotePagesChange,
}: {
  boardId: string;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
  paper: Paper;
  /** Pages saved on the board (the canvas grows past this if the content needs it). */
  notePages?: number;
  onNotePagesChange?: (pages: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<PaperView>({ scrollX: 0, scrollY: 0, zoom: 1 });
  const [pages, setPages] = useState(notePages ?? 1);
  const pagesRef = useRef(notePages ?? 1);
  const props = useRef({ notePages, onNotePagesChange });
  const [initial, setInitial] = useState<SceneRecord | null | undefined>(undefined);
  const [startView, setStartView] = useState<PaperView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: string; meta: NoteMeta } | null>(null);
  const [editing, setEditing] = useState<{ id: string; meta: NoteMeta; x: number; y: number } | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    props.current = { notePages, onNotePagesChange };
  });

  // When the pane changes width (PDF / Split / Notes), re-center the current page in it.
  const lastWidth = useRef<number | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      const prev = lastWidth.current;
      lastWidth.current = el.clientWidth;
      const api = apiRef.current;
      if (!api || prev === null || el.clientWidth === 0 || Math.abs(el.clientWidth - prev) < 8) return;
      const st = api.getAppState();
      const page = Math.min(
        Math.max(Math.floor((el.clientHeight / 2 / st.zoom.value - st.scrollY) / STRIDE), 0),
        pagesRef.current - 1,
      );
      const v = viewForPage(el.clientWidth, page);
      api.updateScene({
        appState: { scrollX: v.scrollX, scrollY: v.scrollY, zoom: { value: v.zoom } } as never,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function ensurePages(n: number) {
    if (n <= pagesRef.current) return;
    pagesRef.current = n;
    setPages(n);
    props.current.onNotePagesChange?.(n);
  }

  useEffect(() => {
    loadScene(boardId).then((s) => {
      const width = wrapRef.current?.clientWidth ?? 600;
      const needed = pagesNeeded((s?.elements ?? []) as { y: number; height: number }[]);
      const total = Math.max(props.current.notePages ?? 1, needed);
      pagesRef.current = total;
      setPages(total);
      if (total !== props.current.notePages) props.current.onNotePagesChange?.(total);
      // A brand-new notebook opens with page 1 fitted to the pane.
      setStartView(s ? null : viewForPage(width, 0));
      setInitial(s ?? null);
    });
  }, [boardId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      onApi?.(api);
    },
    [onApi],
  );

  const currentPage = Math.min(
    Math.max(Math.floor((size.h / 2 / view.zoom - view.scrollY) / STRIDE), 0),
    pages - 1,
  );

  function goToPage(index: number) {
    const api = apiRef.current;
    const w = wrapRef.current?.clientWidth;
    if (!api || !w) return;
    const v = viewForPage(w, Math.min(Math.max(index, 0), pagesRef.current - 1));
    api.updateScene({
      appState: { scrollX: v.scrollX, scrollY: v.scrollY, zoom: { value: v.zoom } } as never,
    });
  }

  function addPage() {
    ensurePages(pagesRef.current + 1);
    goToPage(pagesRef.current - 1);
  }

  function startEdit(id: string, meta: NoteMeta) {
    const api = apiRef.current;
    const el = api?.getSceneElements().find((e) => e.id === id);
    if (!api || !el) return;
    setNoteHidden(api, id, true);
    setEditing({ id, meta, x: el.x, y: el.y });
  }

  async function commitEdit(text: string) {
    const api = apiRef.current;
    const cur = editing;
    setEditing(null);
    if (!api || !cur) return;
    const next = text.replace(/\s+$/, "");
    if (!next.trim()) removeNote(api, cur.id);
    else if (next === cur.meta.text) setNoteHidden(api, cur.id, false);
    else await updateHandwrittenNote(api, cur.id, { text: next, font: cur.meta.font, color: cur.meta.color });
  }

  function cancelEdit() {
    const api = apiRef.current;
    if (api && editing) setNoteHidden(api, editing.id, false);
    setEditing(null);
  }

  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    ensurePages(pagesNeeded(elements));
    // Update the paper in the same frame as the canvas; deferring it made it lag and shake.
    const next = {
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
    };
    setView((prev) =>
      prev.scrollX === next.scrollX && prev.scrollY === next.scrollY && prev.zoom === next.zoom
        ? prev
        : next,
    );
    const selectedIds = Object.keys(appState.selectedElementIds).filter(
      (k) => appState.selectedElementIds[k],
    );
    const sel =
      selectedIds.length === 1
        ? elements.find((e) => e.id === selectedIds[0] && !e.isDeleted)
        : undefined;
    const meta = sel ? getNoteMeta(sel) : null;
    setSelectedNote((prev) => {
      if (!sel || !meta) return prev ? null : prev;
      if (prev && prev.id === sel.id && prev.meta === meta) return prev;
      return { id: sel.id, meta };
    });

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveScene({
        boardId,
        elements: elements.filter((e) => !e.isDeleted) as unknown[],
        files: files as Record<string, unknown>,
        appState: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      })
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true));
    }, SAVE_DELAY_MS);
  }

  // Built once per loaded scene so re-renders never hand Excalidraw a "new" scene.
  const initialData = useMemo(
    () => ({
      elements: (initial?.elements ?? []) as OrderedExcalidrawElement[],
      appState: {
        ...(initial?.appState ?? {}),
        ...(startView
          ? { scrollX: startView.scrollX, scrollY: startView.scrollY, zoom: { value: startView.zoom } }
          : {}),
        viewBackgroundColor: "transparent",
      } as Partial<AppState>,
      files: (initial?.files ?? {}) as BinaryFiles,
    }),
    [initial, startView],
  );

  return (
    <div
      ref={wrapRef}
      onDoubleClick={(e) => {
        if (!selectedNote || editing) return;
        const el = apiRef.current?.getSceneElements().find((x) => x.id === selectedNote.id);
        const box = wrapRef.current?.getBoundingClientRect();
        if (!el || !box) return;
        const px = (e.clientX - box.left) / view.zoom - view.scrollX;
        const py = (e.clientY - box.top) / view.zoom - view.scrollY;
        if (px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height) {
          startEdit(selectedNote.id, selectedNote.meta);
        }
      }}
      className="relative h-full w-full [&_.excalidraw]:!bg-transparent [&_.excalidraw_.excalidraw-container]:!bg-transparent"
    >
      {initial === undefined ? (
        <p className="p-6 text-zinc-500">Loading notes...</p>
      ) : (
        <>
          <PaperBackground paper={paper} view={view} pages={pages} />
          <Excalidraw
            theme="light"
            excalidrawAPI={handleApi}
            initialData={initialData}
            onChange={handleChange}
          />
          <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1.5 py-1 text-sm text-zinc-800 shadow">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="rounded px-2 py-0.5 hover:bg-zinc-100 disabled:opacity-40"
            >
              &lsaquo;
            </button>
            <span className="min-w-20 text-center tabular-nums">
              Page {currentPage + 1} / {pages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= pages - 1}
              aria-label="Next page"
              className="rounded px-2 py-0.5 hover:bg-zinc-100 disabled:opacity-40"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goToPage(currentPage)}
              className="rounded px-2 py-0.5 hover:bg-zinc-100"
            >
              Fit page
            </button>
            <button
              onClick={addPage}
              className="rounded bg-indigo-600 px-2.5 py-0.5 font-medium text-white hover:bg-indigo-700"
            >
              + Add page
            </button>
          </div>
          {saveError && (
            <p
              role="alert"
              className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-md bg-red-100 px-3 py-1.5 text-sm text-red-900 shadow"
            >
              Couldn&apos;t save your notes. Browser storage may be full or blocked.
            </p>
          )}
          {selectedNote && !editing && (
            <button
              onClick={() => startEdit(selectedNote.id, selectedNote.meta)}
              className="absolute left-3 top-16 z-10 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow"
            >
              Edit text
            </button>
          )}
          {editing && (
            <InlineNoteEditor
              meta={editing.meta}
              x={(editing.x + view.scrollX) * view.zoom}
              y={(editing.y + view.scrollY) * view.zoom}
              zoom={view.zoom}
              onCommit={commitEdit}
              onCancel={cancelEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
