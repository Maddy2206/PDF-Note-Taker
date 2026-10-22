"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Board } from "@/lib/types";
import { PAPERS, paperColorOf } from "@/lib/paper";

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString();
}

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

  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  const menuItem =
    "block w-full px-2.5 py-2 text-left text-[13px] hover:bg-[var(--color-surface)]";

  return (
    <div
      className="card relative flex flex-col outline-2 -outline-offset-2 outline-transparent transition hover:shadow-[var(--shadow-md)] hover:outline-[var(--color-text)]"
      style={{ padding: 0, gap: 0, background: "var(--color-surface)" }}
    >
      {editing ? (
        <div className="p-3.5">
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
            className="input"
          />
          {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={commit} className="btn btn-primary">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <Link
            href={`/board/${board.id}`}
            aria-label={`Open ${board.name}`}
            className="block"
          >
            <div
              className="dot-grid relative overflow-hidden border-b-2 border-[var(--color-divider)]"
              style={{ aspectRatio: "16 / 10", backgroundSize: "14px 14px" }}
            >
              <div className="absolute inset-x-[26%] bottom-0 top-8 p-3 shadow-[var(--shadow-md)]"
                style={{ background: paperColorOf(board.paper, board.paperColor) }}>
                <span className="mb-1.5 block h-1.5 w-3/5 bg-[#605d5d]" />
                {[100, 100, 70, 100, 85].map((w, i) => (
                  <span
                    key={i}
                    className="mb-1.5 block h-0.5 bg-[#bab6b6]"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
              <span className="tag tag-neutral absolute left-2.5 top-2.5 !px-2 !py-0.5 !text-[10px]">
                {PAPERS.find((x) => x.id === board.paper)?.label} notes
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
              <div className="card-kicker" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                {board.pageCount > 0
                  ? `Page ${Math.min(board.lastPage, board.pageCount)} of ${board.pageCount}`
                  : "PDF"}
              </div>
              <div className="truncate pr-8 text-[17px] font-extrabold leading-tight">
                {board.name}
              </div>
              <div className="text-[11px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
                Last opened {timeAgo(board.lastOpenedAt)}
              </div>
            </div>
          </Link>
          <span className="absolute bottom-11 right-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-icon"
              style={{ width: 30, height: 30 }}
              aria-label="Board actions"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={(e) => {
                e.stopPropagation();
                setMenu((m) => !m);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menu && (
              <div
                role="menu"
                className="absolute right-0 top-9 z-20 flex w-44 flex-col border border-[var(--color-divider)] bg-white p-1 text-black shadow-[var(--shadow-md)]"
              >
                <Link role="menuitem" href={`/board/${board.id}`} className={menuItem}>
                  Open
                </Link>
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setMenu(false);
                    startEdit();
                  }}
                >
                  Rename
                </button>
                <button
                  role="menuitem"
                  className={`${menuItem} border-t border-[var(--color-divider)] !text-[var(--color-accent-700)] hover:!bg-[var(--color-accent-100)]`}
                  onClick={() => {
                    setMenu(false);
                    setConfirming(true);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </span>
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
          <div className="w-full max-w-sm rounded-xl bg-white p-5 text-black shadow-xl">
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
                className="rounded-md border border-zinc-300 px-3 py-1.5"
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
