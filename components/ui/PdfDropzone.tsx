"use client";

import { useRef, useState } from "react";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload box for one or more PDFs: click to browse or drag files onto it. Validation stays
 * with the parent, which gets the chosen files through onAdd and removals through onRemove.
 */
export default function PdfDropzone({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function choose(list: FileList | null) {
    const chosen = list ? Array.from(list) : [];
    // clear the input so choosing the same file again still counts as a change
    if (inputRef.current) inputRef.current.value = "";
    if (chosen.length) onAdd(chosen);
  }

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="flex items-center gap-3 border-2 border-[var(--color-text)] bg-white p-3"
        >
          <span className="grid h-11 w-11 flex-none place-items-center bg-[var(--color-accent)] text-[var(--color-bg)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold">{file.name}</span>
            <span className="block text-xs text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
              PDF · {formatSize(file.size)}
            </span>
          </span>
          <button type="button" onClick={() => onRemove(i)} className="btn btn-secondary">
            Remove
          </button>
        </div>
      ))}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          choose(e.dataTransfer.files);
        }}
        className={`relative flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed text-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-accent)] ${
          hasFiles ? "px-4 py-4" : "px-6 py-8"
        } ${
          over
            ? "border-[var(--color-accent)] bg-[var(--color-accent-100)]"
            : "border-[var(--color-divider)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-100)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          onChange={(e) => choose(e.target.files)}
          className="absolute h-px w-px opacity-0"
          aria-label="Choose PDF files"
        />
        {!hasFiles && (
          <span className="grid h-12 w-12 place-items-center bg-[var(--color-accent)] text-[var(--color-bg)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 16V4M6 10l6-6 6 6" />
              <path d="M4 20h16" />
            </svg>
          </span>
        )}
        <span className="text-base font-extrabold">
          {hasFiles ? "+ Add more PDFs" : "Drop PDFs here, or choose files"}
        </span>
        {!hasFiles && (
          <span className="text-[13px] text-[color-mix(in_srgb,var(--color-text)_72%,transparent)]">
            All the lectures, textbooks and study guides for one topic can live in one board
          </span>
        )}
      </label>
    </div>
  );
}
