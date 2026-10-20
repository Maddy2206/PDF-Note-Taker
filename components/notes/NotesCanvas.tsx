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
import EditNoteDialog from "./EditNoteDialog";
import { getNoteMeta, updateHandwrittenNote, type NoteMeta } from "./handwritten";
import type { SceneRecord } from "@/lib/types";

const SAVE_DELAY_MS = 800;

export default function NotesCanvas({
  boardId,
  onApi,
}: {
  boardId: string;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
}) {
  const [initial, setInitial] = useState<SceneRecord | null | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: string; meta: NoteMeta } | null>(null);
  const [editing, setEditing] = useState(false);

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
      });
    }, SAVE_DELAY_MS);
  }

  if (initial === undefined) {
    return <p className="p-6 text-zinc-500">Loading notes...</p>;
  }

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={handleApi}
        initialData={{
          elements: (initial?.elements ?? []) as OrderedExcalidrawElement[],
          appState: (initial?.appState ?? {}) as Partial<AppState>,
          files: (initial?.files ?? {}) as BinaryFiles,
        }}
        onChange={handleChange}
      />
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
