"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { deleteBoard, listBoards, updateBoard } from "@/lib/storage";
import type { Board } from "@/lib/types";
import BoardCard from "@/components/dashboard/BoardCard";
import CreateBoardDialog from "@/components/dashboard/CreateBoardDialog";

type Sort = "recent" | "name" | "created";
const SORTS: { id: Sort; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "name", label: "Name" },
  { id: "created", label: "Created" },
];

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listBoards()
      .then(setBoards)
      .catch(() => {
        setStorageError(true);
        setBoards([]);
      });
  }, []);

  // "/" jumps to search, like the design's library.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (boards ?? []).filter((b) => b.name.toLowerCase().includes(q));
    return list.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "created"
          ? b.createdAt - a.createdAt
          : b.lastOpenedAt - a.lastOpenedAt,
    );
  }, [boards, query, sort]);

  async function rename(id: string, name: string) {
    await updateBoard(id, { name });
    setBoards((bs) => bs && bs.map((b) => (b.id === id ? { ...b, name } : b)));
  }

  async function remove(id: string) {
    await deleteBoard(id);
    setBoards((bs) => bs && bs.filter((b) => b.id !== id));
  }

  const hasBoards = (boards?.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen flex-1 bg-[var(--color-bg)]">
      <aside className="sticky top-0 hidden h-screen w-62 flex-none flex-col border-r-2 border-[var(--color-divider)] md:flex" style={{ width: 248 }}>
        <Link href="/" className="flex h-14 flex-none items-center gap-2.5 border-b-2 border-[var(--color-divider)] px-[18px]">
          <span className="h-3 w-3 bg-[var(--color-accent)]" />
          <span className="text-lg font-extrabold tracking-tight">Margin</span>
        </Link>
        <div className="px-3.5 pb-2 pt-3.5">
          <button onClick={() => setCreating(true)} className="btn btn-primary w-full !justify-start gap-2" style={{ height: 38 }}>
            <PlusIcon />
            New board
          </button>
        </div>
        <nav aria-label="Library" className="flex flex-col gap-px px-2 py-1">
          <div className="px-2.5 pb-1.5 pt-3 text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
            Library
          </div>
          <div className="flex items-center gap-2.5 bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)] px-2.5 py-2 text-sm">
            <span className="h-2 w-2 bg-[var(--color-accent)]" />
            <span className="flex-1 font-semibold">All boards</span>
            <span className="text-xs tabular-nums text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
              {boards?.length ?? 0}
            </span>
          </div>
        </nav>
        <div className="mt-auto flex flex-col gap-px border-t-2 border-[var(--color-divider)] p-2">
          <Link href="/" className="flex items-center gap-2.5 px-2.5 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]">
            About Margin
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="flex h-14 items-center gap-2.5 border-b-2 border-[var(--color-divider)] px-4 md:hidden">
          <span className="h-3 w-3 bg-[var(--color-accent)]" />
          <span className="text-[17px] font-extrabold">Margin</span>
          <button onClick={() => setCreating(true)} className="btn btn-primary ml-auto whitespace-nowrap">
            New board
          </button>
        </div>
        <div className="px-[clamp(16px,4vw,40px)] pb-[72px] pt-7">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3.5 border-b-2 border-[var(--color-divider)] pb-[18px]">
            <div className="mr-auto min-w-0">
              <div className="mb-2 text-xs uppercase tracking-[0.08em] text-[var(--color-accent-700)]">Library</div>
              <h1 className="m-0 text-[34px] leading-none tracking-tight">All boards</h1>
            </div>
            <div className="relative w-[min(320px,100%)]">
              <svg className="pointer-events-none absolute left-2.5 top-2.5 opacity-70" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchRef}
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search boards"
                aria-label="Search boards"
                style={{ paddingLeft: 34, paddingRight: 34 }}
              />
              <span className="pointer-events-none absolute right-2 top-2 border border-[var(--color-divider)] px-1.5 py-px text-[11px] text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
                /
              </span>
            </div>
            <div className="seg" role="group" aria-label="Sort">
              {SORTS.map((o) => (
                <button key={o.id} className="seg-opt" aria-pressed={sort === o.id} onClick={() => setSort(o.id)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {storageError && (
            <p role="alert" className="mt-4 bg-[var(--color-accent-100)] px-3 py-2 text-sm text-[var(--color-accent-800)]">
              Couldn&apos;t open browser storage, so your boards can&apos;t be loaded or saved. Check that
              storage isn&apos;t blocked (for example in a private window) and reload.
            </p>
          )}

          <section aria-labelledby="boards" className="pt-8">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 id="boards" className="m-0 text-xs font-semibold uppercase tracking-[0.08em]">
                {query ? "Results" : sort === "recent" ? "Recently opened" : "Boards"}
              </h2>
              <span className="text-xs text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
                {shown.length} {shown.length === 1 ? "board" : "boards"}
              </span>
            </div>
            {boards === null ? (
              <p className="text-[var(--color-neutral-600,#7d7979)]">Loading...</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(340px,100%),1fr))" }}>
                {!query && (
                  <button
                    onClick={() => setCreating(true)}
                    className="flex min-h-[250px] flex-col items-start justify-end gap-2 border-2 border-dashed border-[var(--color-divider)] p-4 text-left transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-100)]"
                  >
                    <span className="grid h-9 w-9 place-items-center bg-[var(--color-accent)] text-[var(--color-bg)]">
                      <PlusIcon />
                    </span>
                    <span className="text-[17px] font-extrabold">New board</span>
                    <span className="text-[13px] text-[color-mix(in_srgb,var(--color-text)_72%,transparent)]">
                      {hasBoards ? "Upload another PDF and start a notebook" : "Upload a PDF to start your first notebook"}
                    </span>
                  </button>
                )}
                {shown.map((b) => (
                  <BoardCard key={b.id} board={b} onRename={rename} onDelete={remove} />
                ))}
              </div>
            )}
            {boards !== null && query && shown.length === 0 && (
              <p className="mt-6 text-sm">No boards match &ldquo;{query}&rdquo;.</p>
            )}
          </section>
        </div>
      </main>

      {creating && <CreateBoardDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
