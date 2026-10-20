"use client";

import { useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { loadScene, saveScene } from "@/lib/storage";
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

  useEffect(() => {
    loadScene(boardId).then((s) => setInitial(s ?? null));
  }, [boardId]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
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
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={onApi}
        initialData={{
          elements: (initial?.elements ?? []) as OrderedExcalidrawElement[],
          appState: (initial?.appState ?? {}) as Partial<AppState>,
          files: (initial?.files ?? {}) as BinaryFiles,
        }}
        onChange={handleChange}
      />
    </div>
  );
}
