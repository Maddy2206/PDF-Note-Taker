"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBoard, getPdf, updateBoard } from "@/lib/storage";
import type { Board, PaneVisibility } from "@/lib/types";
import dynamic from "next/dynamic";
import PdfViewer from "@/components/pdf/PdfViewer";
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

  useEffect(() => {
    (async () => {
      const b = await getBoard(id);
      const blob = await getPdf(id);
      if (!b || !blob) {
        setMissing(true);
        return;
      }
      setBoard((await updateBoard(id, { lastOpenedAt: Date.now() })) ?? b);
      setPdf(blob);
    })();
  }, [id]);

  function save(patch: Partial<Board>) {
    setBoard((b) => (b ? { ...b, ...patch } : b));
    updateBoard(id, patch);
  }

  function toggle(key: keyof PaneVisibility) {
    if (!board) return;
    const next = { ...board.paneVisibility, [key]: !board.paneVisibility[key] };
    if (!next.pdf && !next.notes) return; // keep at least one pane open
    save({ paneVisibility: next });
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
        <div className="ml-auto flex gap-2 text-sm">
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
      <div className="min-h-0 flex-1">
        <SplitLayout
          ratio={board.dividerRatio}
          visibility={board.paneVisibility}
          onRatioChange={(dividerRatio) => save({ dividerRatio })}
          onVisibilityChange={(paneVisibility) => save({ paneVisibility })}
          pdf={
            <PdfViewer
              blob={pdf}
              onLoaded={(pageCount) => updateBoard(id, { pageCount })}
            />
          }
          notes={<NotesCanvas boardId={id} />}
        />
      </div>
    </div>
  );
}
