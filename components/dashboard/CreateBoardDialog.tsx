"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/storage";
import { validatePdf } from "@/lib/pdf-validate";
import type { Paper } from "@/lib/types";

export default function CreateBoardDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paper, setPaper] = useState<Paper>("lined");

  async function pickFile(f: File | null) {
    setError(null);
    setFile(null);
    if (!f) return;
    const problem = await validatePdf(f);
    if (problem) {
      setError(problem);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
    if (!name.trim()) setName(f.name.replace(/\.pdf$/i, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    setBusy(true);
    try {
      const board = await createBoard(name.trim(), file, paper);
      router.push(`/board/${board.id}`);
    } catch {
      setError("Couldn't save the board. Browser storage may be full or blocked.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Create board</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Board name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic Chemistry, ch. 3"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">PDF file</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </label>
        <fieldset className="text-sm">
          <legend className="mb-1 text-zinc-600 dark:text-zinc-400">Notes page type</legend>
          <div className="flex gap-2">
            {(["lined", "blank"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPaper(p)}
                aria-pressed={paper === p}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 font-medium aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:border-zinc-700"
              >
                {p === "lined" ? "Lined notebook" : "Blank page"}
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || !name.trim() || busy}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create board"}
          </button>
        </div>
      </form>
    </div>
  );
}
