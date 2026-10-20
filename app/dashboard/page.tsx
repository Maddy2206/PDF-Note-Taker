"use client";

import { useEffect, useState } from "react";
import { listBoards } from "@/lib/storage";
import type { Board } from "@/lib/types";
import BoardCard from "@/components/dashboard/BoardCard";
import CreateBoardDialog from "@/components/dashboard/CreateBoardDialog";

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listBoards().then(setBoards);
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your boards</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create board
        </button>
      </header>

      {boards === null ? (
        <p className="text-zinc-500">Loading...</p>
      ) : boards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="mb-1 font-medium">No boards yet</p>
          <p className="text-sm text-zinc-500">
            Create a board and upload a PDF to start taking notes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <BoardCard key={b.id} board={b} />
          ))}
        </div>
      )}

      {creating && <CreateBoardDialog onClose={() => setCreating(false)} />}
    </main>
  );
}
