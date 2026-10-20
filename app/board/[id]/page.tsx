"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBoard, getPdf, updateBoard } from "@/lib/storage";
import type { Board } from "@/lib/types";
import PdfViewer from "@/components/pdf/PdfViewer";

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
      </header>
      <div className="min-h-0 flex-1">
        <PdfViewer
          blob={pdf}
          onLoaded={(pageCount) => updateBoard(id, { pageCount })}
        />
      </div>
    </div>
  );
}
