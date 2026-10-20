"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Board } from "@/lib/types";

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString();
}

const iconBtn =
  "rounded px-2 py-0.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export default function BoardCard({
  board,
  onRename,
  onDelete,
}: {
  board: Board;
  onRename: (id: string, name: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(board.name);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setDraft(board.name);
    setError(null);
    setEditing(true);
  }

  async function commit() {
    const name = draft.trim();
    if (!name) {
      setError("Name can't be empty.");
      return;
    }
    if (name !== board.name) await onRename(board.id, name);
    setEditing(false);
  }

  async function confirmDelete() {
    setBusy(true);
    await onDelete(board.id);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {editing ? (
        <div>
          <input
            ref={inputRef}
            value={draft}
            autoFocus
            aria-label="Board name"
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1 font-medium dark:border-zinc-700"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex gap-2 text-sm">
            <button onClick={commit} className="rounded bg-indigo-600 px-2 py-0.5 text-white">
              Save
            </button>
            <button onClick={() => setEditing(false)} className={iconBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <Link href={`/board/${board.id}`} className="block">
            <h3 className="truncate font-medium">{board.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Last opened {timeAgo(board.lastOpenedAt)}
            </p>
            {board.pageCount > 0 && (
              <p className="text-sm text-zinc-500">
                Page {Math.min(board.lastPage, board.pageCount)} of {board.pageCount}
              </p>
            )}
          </Link>
          <div className="mt-3 flex gap-1">
            <button onClick={startEdit} className={iconBtn}>
              Rename
            </button>
            <button onClick={() => setConfirming(true)} className={iconBtn}>
              Delete
            </button>
          </div>
        </>
      )}

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete board"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onKeyDown={(e) => e.key === "Escape" && !busy && setConfirming(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-2 text-lg font-semibold">Delete this board?</h2>
            <p className="mb-4 text-sm">
              &ldquo;{board.name}&rdquo; and its PDF, notes and highlights will be deleted. This
              can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2 text-sm">
              <button
                autoFocus
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
