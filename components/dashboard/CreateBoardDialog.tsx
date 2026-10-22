"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/storage";
import { validatePdf } from "@/lib/pdf-validate";
import type { Paper } from "@/lib/types";
import PdfDropzone from "@/components/ui/PdfDropzone";
import PageStylePicker from "@/components/ui/PageStylePicker";

export default function CreateBoardDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paper, setPaper] = useState<Paper>("lined");
  const [paperColor, setPaperColor] = useState("#fffdf8");

  async function addFiles(list: File[]) {
    setError(null);
    const good: File[] = [];
    const problems: string[] = [];
    for (const f of list) {
      const problem = await validatePdf(f);
      if (problem) problems.push(`${f.name}: ${problem}`);
      else good.push(f);
    }
    if (problems.length) setError(problems.join(" "));
    if (!good.length) return;
    setFiles((cur) => [...cur, ...good]);
    if (!name.trim()) setName(good[0].name.replace(/\.pdf$/i, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !name.trim()) return;
    setBusy(true);
    try {
      const board = await createBoard(name.trim(), files, paper, paperColor);
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
        style={{ background: "#ffffff", color: "#000000" }}
        className="max-h-[94vh] w-full max-w-2xl space-y-5 overflow-y-auto border border-zinc-300 p-8 shadow-xl"
      >
        <h2 className="text-2xl font-extrabold">Create board</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Board name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic Chemistry, ch. 3"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2"
          />
        </label>
        <div className="text-sm">
          <span className="mb-1 block text-zinc-600">PDF files</span>
          <PdfDropzone
            files={files}
            onAdd={addFiles}
            onRemove={(i) => setFiles((cur) => cur.filter((_, j) => j !== i))}
          />
        </div>
        <PageStylePicker
          paper={paper}
          color={paperColor}
          onChange={(p, c) => {
            setPaper(p);
            setPaperColor(c);
          }}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={files.length === 0 || !name.trim() || busy}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create board"}
          </button>
        </div>
      </form>
    </div>
  );
}
