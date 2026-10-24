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
import { PAGE_H, PAGE_W, STRIDE, pageTop, pagesNeeded } from "@/lib/pages";
import PaperBackground, { type PaperView } from "./PaperBackground";
import InlineNoteEditor from "./InlineNoteEditor";
import NotesToolbar, { type NoteTool } from "./NotesToolbar";
import type { FontId } from "@/lib/handwriting-fonts";
import {
  getNoteMeta,
  removeNote,
  setNoteHidden,
  updateHandwrittenNote,
  type NoteMeta,
} from "./handwritten";
import type { NoteSource, Paper, SceneRecord } from "@/lib/types";

const SAVE_DELAY_MS = 800;

const DESK = 16;
const FOOTER = 16;

/**
 * Keeps the view over the notebook: you can't scroll into empty gray desk past the first
 * or last page. When the pages are smaller than the pane they stay centered.
 */
function clampScroll(
  scrollX: number,
  scrollY: number,
  zoom: number,
  width: number,
  height: number,
  pages: number,
) {
  const m = DESK / zoom;
  const bottom = FOOTER / zoom;
  const vw = width / zoom;
  const vh = height / zoom;
  const total = pageTop(pages - 1) + PAGE_H;
  const axis = (scroll: number, view: number, content: number, end: number) => {
    if (view >= content + m + end) return (view - content) / 2;
    return Math.min(m, Math.max(view - content - end, scroll));
  };
  return { x: axis(scrollX, vw, PAGE_W, m), y: axis(scrollY, vh, total, bottom) };
}

/** Zoom and scroll that show notebook page `index` centered, fitted to the pane width. */
function viewForPage(width: number, index: number): PaperView {
  const zoom = Math.min(Math.max((width - 48) / PAGE_W, 0.25), 1.5);
  return { zoom, scrollX: (width / zoom - PAGE_W) / 2, scrollY: 24 / zoom - pageTop(index) };
}

const CHIP = { w: 100, h: 28, gap: 8 };

/** Places the chip above the note's top-right corner (below it if there is no room), inside the pane. */
function chipStyle(
  box: { x: number; y: number; w: number; h: number },
  view: PaperView,
  pane: { w: number; h: number },
) {
  const right = (box.x + box.w + view.scrollX) * view.zoom;
  const top = (box.y + view.scrollY) * view.zoom;
  const bottom = top + box.h * view.zoom;
  let y = top - CHIP.h - CHIP.gap;
  if (y < 4) y = bottom + CHIP.gap;
  const maxX = Math.max(4, pane.w - CHIP.w - 4);
  const maxY = Math.max(4, pane.h - CHIP.h - 4);
  return {
    left: Math.min(Math.max(right - CHIP.w, 4), maxX),
    top: Math.min(Math.max(y, 4), maxY),
  };
}

export default function NotesCanvas({
  boardId,
  onApi,
  paper,
  paperColor,
  notePages,
  onNotePagesChange,
  onSaveState,
  ink,
  onInk,
  fontId,
  onFont,
  getSource,
  onJumpToSource,
}: {
  boardId: string;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
  paper: Paper;
  paperColor?: string;
  /** Pages saved on the board (the canvas grows past this if the content needs it). */
  notePages?: number;
  onNotePagesChange?: (pages: number) => void;
  /** Reports whether the notes are being saved, are saved, or couldn't be saved. */
  onSaveState?: (state: "saving" | "saved" | "error") => void;
  /** Ink color and handwriting font, shared with the PDF pane. */
  ink: string;
  onInk: (color: string) => void;
  fontId: FontId;
  onFont: (font: FontId) => void;
  /** Where a board element came from in the PDFs, or null if unknown. */
  getSource?: (element: { id: string; customData?: Record<string, unknown> }) => NoteSource | null;
  onJumpToSource?: (source: NoteSource) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<PaperView>({ scrollX: 0, scrollY: 0, zoom: 1 });
  const [pages, setPages] = useState(notePages ?? 1);
  const pagesRef = useRef(notePages ?? 1);
  const props = useRef({ notePages, onNotePagesChange, onSaveState, getSource });
  // The selected note's source and where it sits; the chip shows once the selection settles.
  const [source, setSource] = useState<{ src: NoteSource; box: { x: number; y: number; w: number; h: number } } | null>(null);
  const [chipVisible, setChipVisible] = useState(false);
  const chipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chipSel = useRef<{ id: string; geo: string; moved: boolean } | null>(null);
  const [initial, setInitial] = useState<SceneRecord | null | undefined>(undefined);
  const [startView, setStartView] = useState<PaperView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: string; meta: NoteMeta } | null>(null);
  const [editing, setEditing] = useState<{ id: string; meta: NoteMeta; x: number; y: number } | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [tool, setTool] = useState<NoteTool>("selection");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    props.current = { notePages, onNotePagesChange, onSaveState, getSource };
  });

  useEffect(() => {
    const timers = chipTimers;
    return () => timers.current.forEach(clearTimeout);
  }, []);

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

  function zoomBy(factor: number) {
    const api = apiRef.current;
    if (!api) return;
    const st = api.getAppState();
    const z = Math.min(Math.max(st.zoom.value * factor, 0.25), 3);
    // keep the middle of the pane where it is
    const dx = (size.w / 2) * (1 / z - 1 / st.zoom.value);
    const dy = (size.h / 2) * (1 / z - 1 / st.zoom.value);
    api.updateScene({
      appState: { scrollX: st.scrollX + dx, scrollY: st.scrollY + dy, zoom: { value: z } } as never,
    });
  }

  // Same trick as the board page: Excalidraw handles its own undo and redo shortcuts.
  function history(redo: boolean) {
    document.querySelector(".excalidraw")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: redo ? "y" : "z",
        code: redo ? "KeyY" : "KeyZ",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function pickTool(t: NoteTool) {
    apiRef.current?.setActiveTool({ type: t });
  }

  // The ink color is used by new strokes and recolors whatever is selected.
  function pickInk(color: string) {
    onInk(color);
    const api = apiRef.current;
    if (!api) return;
    api.updateScene({ appState: { currentItemStrokeColor: color } as never });
    if (selectedNote) {
      updateHandwrittenNote(api, selectedNote.id, { ...selectedNote.meta, color });
      return;
    }
    const st = api.getAppState();
    const ids = Object.keys(st.selectedElementIds).filter((k) => st.selectedElementIds[k]);
    if (ids.length === 0) return;
    api.updateScene({
      elements: api.getSceneElements().map((e) =>
        ids.includes(e.id) && e.type !== "image"
          ? ({ ...e, strokeColor: color, version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31) } as typeof e)
          : e,
      ),
    });
  }

  function pickFont(font: FontId) {
    onFont(font);
    const api = apiRef.current;
    if (api && selectedNote) updateHandwrittenNote(api, selectedNote.id, { ...selectedNote.meta, font });
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
    const box = wrapRef.current;
    if (box && box.clientWidth > 0 && box.clientHeight > 0) {
      const c = clampScroll(
        appState.scrollX,
        appState.scrollY,
        appState.zoom.value,
        box.clientWidth,
        box.clientHeight,
        pagesRef.current,
      );
      if (Math.abs(c.x - appState.scrollX) > 0.5 || Math.abs(c.y - appState.scrollY) > 0.5) {
        apiRef.current?.updateScene({ appState: { scrollX: c.x, scrollY: c.y } as never });
        return; // the corrected view triggers another change with the right values
      }
    }
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
    setTool(appState.activeTool.type as NoteTool);
    const selectedIds = Object.keys(appState.selectedElementIds).filter(
      (k) => appState.selectedElementIds[k],
    );
    const sel =
      selectedIds.length === 1
        ? elements.find((e) => e.id === selectedIds[0] && !e.isDeleted)
        : undefined;
    const meta = sel ? getNoteMeta(sel) : null;
    const src = sel ? (props.current.getSource?.(sel as { id: string; customData?: Record<string, unknown> }) ?? null) : null;
    const geo = sel ? `${sel.x},${sel.y},${sel.width},${sel.height}` : "";
    const last = chipSel.current;
    if (!sel || !src) {
      chipSel.current = null;
      chipTimers.current.forEach(clearTimeout);
      chipTimers.current = [];
      setChipVisible(false);
      setSource((prev) => (prev ? null : prev));
    } else if (!last || last.id !== sel.id) {
      // a new selection: show the chip once it has stayed still for a moment, then fade it
      chipSel.current = { id: sel.id, geo, moved: false };
      chipTimers.current.forEach(clearTimeout);
      chipTimers.current = [
        setTimeout(() => setChipVisible(true), 400),
        setTimeout(() => setChipVisible(false), 4400),
      ];
      setChipVisible(false);
    } else if (last.geo !== geo) {
      // dragging or resizing: no chip until the note is selected again
      last.geo = geo;
      last.moved = true;
      chipTimers.current.forEach(clearTimeout);
      chipTimers.current = [];
      setChipVisible(false);
    }
    if (sel && src) {
      setSource((prev) =>
        prev && prev.src.docId === src.docId && prev.src.page === src.page && prev.src.rect.x === src.rect.x &&
        prev.src.rect.y === src.rect.y && prev.box.x === sel.x && prev.box.y === sel.y && prev.box.w === sel.width && prev.box.h === sel.height
          ? prev
          : { src, box: { x: sel.x, y: sel.y, w: sel.width, h: sel.height } },
      );
    }
    setSelectedNote((prev) => {
      if (!sel || !meta) return prev ? null : prev;
      if (prev && prev.id === sel.id && prev.meta === meta) return prev;
      return { id: sel.id, meta };
    });

    if (timer.current) clearTimeout(timer.current);
    props.current.onSaveState?.("saving");
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
        .then(() => {
          setSaveError(false);
          props.current.onSaveState?.("saved");
        })
        .catch(() => {
          setSaveError(true);
          props.current.onSaveState?.("error");
        });
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

  const barBtn =
    "btn btn-icon !h-7 !w-7 disabled:opacity-40";
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[42px] flex-none border-b-2 border-[var(--color-divider)] bg-[var(--color-surface)]">
        <div
          role="tablist"
          aria-label="Notebook pages"
          className="flex min-w-0 overflow-x-auto [scrollbar-width:none]"
        >
          {Array.from({ length: pages }, (_, i) => {
            const on = i === currentPage;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={on}
                onClick={() => goToPage(i)}
                className={`flex flex-none items-center whitespace-nowrap border-r border-[var(--color-divider)] px-4 text-[13px] ${
                  on
                    ? "-mb-0.5 h-[44px] bg-[var(--color-bg)] font-bold shadow-[inset_0_3px_0_var(--color-accent)]"
                    : "h-[42px] font-medium hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]"
                }`}
              >
                Page {i + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={addPage}
          className="flex flex-none items-center gap-1.5 whitespace-nowrap px-3.5 text-[13px] font-semibold text-[var(--color-accent-700)] hover:bg-[var(--color-accent-100)]"
        >
          <span aria-hidden className="text-lg leading-none">+</span> Add page
        </button>
      </div>
      <NotesToolbar
        tool={tool}
        onTool={pickTool}
        locked={locked}
        onLock={() => setLocked((v) => !v)}
        ink={ink}
        onInk={pickInk}
        fontId={fontId}
        onFont={pickFont}
        disabled={initial === undefined}
      />
      <div
        ref={wrapRef}
        onDoubleClick={(e) => {
          const api = apiRef.current;
          const box = wrapRef.current?.getBoundingClientRect();
          if (!api || !box || editing || locked) return;
          const px = (e.clientX - box.left) / view.zoom - view.scrollX;
          const py = (e.clientY - box.top) / view.zoom - view.scrollY;
          // the top-most note under the pointer, selected or not
          const hit = [...api.getSceneElements()].reverse().find((el) => {
            return (
              !el.isDeleted &&
              getNoteMeta(el) &&
              px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height
            );
          });
          const meta = hit && getNoteMeta(hit);
          if (hit && meta) startEdit(hit.id, meta);
        }}
        className="notes-canvas relative min-h-0 w-full flex-1 [&_.excalidraw]:!bg-transparent [&_.excalidraw_.excalidraw-container]:!bg-transparent"
      >
        {initial === undefined ? (
          <p className="p-6 text-zinc-500">Loading notes...</p>
        ) : (
          <>
            <PaperBackground paper={paper} color={paperColor} view={view} pages={pages} />
            <Excalidraw
              theme="light"
              excalidrawAPI={handleApi}
              initialData={initialData}
              onChange={handleChange}
              viewModeEnabled={locked}
            />
            {saveError && (
              <p
                role="alert"
                className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-red-100 px-3 py-1.5 text-sm text-red-900 shadow"
              >
                Couldn&apos;t save your notes. Browser storage may be full or blocked.
              </p>
            )}
            {source && onJumpToSource && chipVisible && !editing && !locked && tool === "selection" && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setChipVisible(false);
                  onJumpToSource(source.src);
                }}
                title="Jump to where this note came from in the PDF"
                style={chipStyle(source.box, view, size)}
                className="absolute z-20 whitespace-nowrap border border-[var(--color-divider)] bg-white px-2 py-1 text-xs shadow hover:bg-[var(--color-surface)]"
              >
                Go to source
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
      <div className="flex h-[34px] flex-none items-center gap-1 overflow-hidden whitespace-nowrap border-t border-[var(--color-divider)] px-1.5 text-xs">
        <button onClick={() => zoomBy(1 / 1.15)} aria-label="Zoom out notebook" className={barBtn}>
          &minus;
        </button>
        <span className="min-w-10 text-center tabular-nums">{Math.round(view.zoom * 100)}%</span>
        <button onClick={() => zoomBy(1.15)} aria-label="Zoom in notebook" className={barBtn}>
          +
        </button>
        <button
          onClick={() => goToPage(currentPage)}
          className="px-2 py-1 hover:bg-[var(--color-surface)]"
        >
          Fit page
        </button>
        <span className="mx-1 h-[18px] w-px bg-[var(--color-divider)]" aria-hidden />
        <button onClick={() => history(false)} aria-label="Undo" title="Undo (Ctrl+Z)" className={barBtn}>
          &#8630;
        </button>
        <button onClick={() => history(true)} aria-label="Redo" title="Redo (Ctrl+Y)" className={barBtn}>
          &#8631;
        </button>
        <span className="ml-auto pr-2 tabular-nums text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
          Page {currentPage + 1} of {pages}
        </span>
      </div>
    </div>
  );
}
