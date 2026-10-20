"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { loadScene, saveScene } from "@/lib/storage";
import PaperBackground, { type PaperView } from "./PaperBackground";
import { exportNotesPdf } from "@/lib/export-pdf";
import EditNoteDialog from "./EditNoteDialog";
import { getNoteMeta, updateHandwrittenNote, type NoteMeta } from "./handwritten";
import type { Paper, SceneRecord } from "@/lib/types";

const SAVE_DELAY_MS = 800;

export default function NotesCanvas({
  boardId,
  onApi,
  paper,
  onPaperChange,
  boardName,
}: {
  boardId: string;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
  paper: Paper;
  onPaperChange: (p: Paper) => void;
  boardName: string;
}) {
  const [view, setView] = useState<PaperView>({ scrollX: 0, scrollY: 0, zoom: 1 });
  const viewRaf = useRef<number | null>(null);
  const pendingView = useRef<PaperView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(
    () => () => {
      if (viewRaf.current) cancelAnimationFrame(viewRaf.current);
    },
    [],
  );

  async function downloadPdf() {
    const api = apiRef.current;
    if (!api || exporting) return;
    setExporting(true);
    try {
      const ok = await exportNotesPdf({
        elements: api.getSceneElements(),
        files: api.getFiles(),
        paper,
        fileName: boardName,
      });
      if (!ok) {
        setToast("Nothing to download yet");
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast("Could not create the PDF");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setExporting(false);
    }
  }
  const [initial, setInitial] = useState<SceneRecord | null | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: string; meta: NoteMeta } | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    loadScene(boardId).then((s) => setInitial(s ?? null));
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

  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    pendingView.current = { scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom.value };
    if (!viewRaf.current) {
      viewRaf.current = requestAnimationFrame(() => {
        viewRaf.current = null;
        const v = pendingView.current;
        if (!v) return;
        setView((prev) =>
          prev.scrollX === v.scrollX && prev.scrollY === v.scrollY && prev.zoom === v.zoom ? prev : v,
        );
      });
    }
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

  if (initial === undefined) {
    return <p className="p-6 text-zinc-500">Loading notes...</p>;
  }

  return (
    <div className="relative h-full w-full [&_.excalidraw]:!bg-transparent [&_.excalidraw_.excalidraw-container]:!bg-transparent">
      <PaperBackground paper={paper} view={view} />
      <Excalidraw
        theme="light"
        excalidrawAPI={handleApi}
        initialData={{
          elements: (initial?.elements ?? []) as OrderedExcalidrawElement[],
          appState: {
            ...(initial?.appState ?? {}),
            viewBackgroundColor: "transparent",
          } as Partial<AppState>,
          files: (initial?.files ?? {}) as BinaryFiles,
        }}
        onChange={handleChange}
      />
      <div className="absolute bottom-16 right-3 z-10 flex flex-col items-end gap-2">
        <div className="flex overflow-hidden rounded-md border border-zinc-300 bg-white text-sm font-medium shadow">
          {(["lined", "blank"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPaperChange(p)}
              aria-pressed={paper === p}
              className={`px-3 py-1.5 ${paper === p ? "bg-indigo-600 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
            >
              {p === "lined" ? "Lined" : "Blank"}
            </button>
          ))}
        </div>
        <button
          onClick={downloadPdf}
          disabled={exporting}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow disabled:opacity-60"
        >
          {exporting ? "Preparing..." : "Download PDF"}
        </button>
        {toast && (
          <p role="status" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white shadow">
            {toast}
          </p>
        )}
      </div>
      {saveError && (
        <p
          role="alert"
          className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-md bg-red-100 px-3 py-1.5 text-sm text-red-900 shadow"
        >
          Couldn&apos;t save your notes. Browser storage may be full or blocked.
        </p>
      )}
      {selectedNote && (
        <button
          onClick={() => setEditing(true)}
          className="absolute left-3 top-16 z-10 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow"
        >
          Edit handwritten note
        </button>
      )}
      {editing && selectedNote && (
        <EditNoteDialog
          initial={selectedNote.meta}
          onClose={() => setEditing(false)}
          onSave={async (meta) => {
            if (apiRef.current) await updateHandwrittenNote(apiRef.current, selectedNote.id, meta);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
