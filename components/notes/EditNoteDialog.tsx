"use client";

import { useState } from "react";
import {
  HANDWRITING_FONTS,
  HIGHLIGHT_COLORS,
} from "@/lib/handwriting-fonts";
import type { NoteMeta } from "./handwritten";

export default function EditNoteDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: NoteMeta;
  onSave: (meta: Omit<NoteMeta, "kind">) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [font, setFont] = useState(initial.font);
  const [color, setColor] = useState(initial.color);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="font-semibold">Edit handwritten note</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
        />
        <div className="flex items-center gap-3">
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            aria-label="Handwriting font"
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
          >
            {HANDWRITING_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={c.label}
                aria-pressed={color === c.value}
                onClick={() => setColor(c.value)}
                style={{ background: c.value }}
                className="h-6 w-6 rounded-full border border-black/10 aria-pressed:ring-2 aria-pressed:ring-indigo-500"
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => text.trim() && onSave({ text: text.trim(), font, color })}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
