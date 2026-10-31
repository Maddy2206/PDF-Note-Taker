"use client";

import { useEffect, useRef, useState } from "react";
import { validatePdf } from "@/lib/pdf-validate";
import type { PdfDoc } from "@/lib/types";

/** One tab per PDF in the board, plus "+" to add more. Double-click a tab to rename it. */
export default function PdfTabs({
  docs,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  onError,
  locked = false,
}: {
  docs: PdfDoc[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (files: File[]) => void | Promise<void>;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void | Promise<void>;
  onError: (message: string) => void;
  /** Focus mode: no adding or removing PDFs (no file pickers or dialogs). */
  locked?: boolean;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removing, setRemoving] = useState<PdfDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function commitRename() {
    const name = draft.trim();
    const doc = docs.find((d) => d.id === renaming);
    if (doc && name && name !== doc.name) onRename(doc.id, name);
    setRenaming(null);
  }

  async function choose(list: FileList | null) {
    const chosen = list ? Array.from(list) : [];
    if (fileRef.current) fileRef.current.value = "";
    const good: File[] = [];
    const problems: string[] = [];
    for (const f of chosen) {
      const problem = await validatePdf(f);
      if (problem) problems.push(`${f.name}: ${problem}`);
      else good.push(f);
    }
    if (problems.length) onError(problems.join(" "));
    if (good.length) await onAdd(good);
  }

  return (
    <div className="flex h-[42px] flex-none items-stretch border-b-2 border-[var(--color-divider)] bg-[var(--color-surface)]">
      <div
        role="tablist"
        aria-label="PDFs in this board"
        className="flex min-w-0 items-stretch overflow-x-auto"
      >
        {docs.map((d) => {
          const active = d.id === activeId;
          return (
            <div
              key={d.id}
              ref={active ? activeRef : undefined}
              className={`group flex max-w-56 flex-none items-center gap-1.5 border-r border-[var(--color-divider)] px-3 text-[13px] ${
                active
                  ? "-mb-0.5 bg-[var(--color-bg)] font-bold shadow-[inset_0_3px_0_var(--color-accent)]"
                  : "hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]"
              }`}
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="flex-none opacity-70">
                <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                <path d="M14 3v5h5" />
              </svg>
              {renaming === d.id ? (
                <input
                  autoFocus
                  value={draft}
                  aria-label="PDF name"
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="h-7 w-40 border border-[var(--color-divider)] bg-white px-1.5 text-sm font-normal text-black"
                />
              ) : (
                <button
                  role="tab"
                  aria-selected={active}
                  title={`${d.name} (double-click to rename)`}
                  onClick={() => onSelect(d.id)}
                  onDoubleClick={() => {
                    setDraft(d.name);
                    setRenaming(d.id);
                  }}
                  className="min-w-0 flex-1 truncate py-2 text-left"
                >
                  {d.name}
                </button>
              )}
              {!locked && docs.length > 1 && renaming !== d.id && (
                <button
                  aria-label={`Remove ${d.name}`}
                  title="Remove this PDF"
                  onClick={() => setRemoving(d)}
                  className="grid h-5 w-5 flex-none place-items-center text-base leading-none opacity-50 hover:bg-[color-mix(in_srgb,var(--color-text)_12%,transparent)] hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!locked && (
      <button
        onClick={() => fileRef.current?.click()}
        aria-label="Add PDFs to this board"
        title="Add PDFs to this board"
        className="flex flex-none items-center gap-1 px-3 text-sm font-extrabold text-[var(--color-accent-700)] hover:bg-[var(--color-accent-100)]"
      >
        <span aria-hidden className="text-lg leading-none">+</span> Add PDF
      </button>
      )}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="application/pdf,.pdf"
        onChange={(e) => choose(e.target.files)}
        className="hidden"
      />

      {removing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Remove PDF"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onKeyDown={(e) => e.key === "Escape" && !busy && setRemoving(null)}
        >
          <div
            className="w-full max-w-sm p-5 shadow-xl"
            style={{ background: "#fff", color: "#000" }}
          >
            <h2 className="mb-2 text-lg font-extrabold">Remove this PDF?</h2>
            <p className="mb-4 text-sm">
              &ldquo;{removing.name}&rdquo; and the highlights you made on it will be removed from
              this board. Your notes stay.
            </p>
            <div className="flex justify-end gap-2">
              <button
                autoFocus
                disabled={busy}
                onClick={() => setRemoving(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await onRemove(removing.id);
                  setBusy(false);
                  setRemoving(null);
                }}
                className="btn btn-primary"
              >
                {busy ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
