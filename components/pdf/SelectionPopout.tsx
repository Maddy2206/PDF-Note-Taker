"use client";

import { useState } from "react";
import {
  HANDWRITING_FONTS,
  HIGHLIGHT_COLORS,
  type FontId,
} from "@/lib/handwriting-fonts";

interface Props {
  x: number;
  y: number;
  onExport: (color: string, font: FontId) => void;
  onDismiss: () => void;
}

/** Appears next to selected PDF text: pick a color and handwriting font, then export. */
const HALF_WIDTH = 200; // about half the popout's width

export default function SelectionPopout({ x, y, onExport, onDismiss }: Props) {
  const [color, setColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [font, setFont] = useState<FontId>("caveat");

  return (
    <div
      // keep the text selection alive while using the popout
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLSelectElement)) e.preventDefault();
      }}
      style={{
        left: Math.min(Math.max(x, HALF_WIDTH), window.innerWidth - HALF_WIDTH),
        top: Math.min(y, window.innerHeight - 56),
      }}
      className="fixed z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      role="dialog"
      aria-label="Highlight options"
    >
      <div className="flex gap-1">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            aria-label={c.label}
            aria-pressed={color === c.value}
            onClick={() => setColor(c.value)}
            style={{ background: c.value }}
            className="h-6 w-6 rounded-full border border-black/10 aria-pressed:ring-2 aria-pressed:ring-indigo-500"
          />
        ))}
      </div>
      <select
        value={font}
        onChange={(e) => setFont(e.target.value as FontId)}
        aria-label="Handwriting font"
        className="rounded-md border border-zinc-300 bg-transparent px-1 py-1 dark:border-zinc-700"
        style={{ fontFamily: HANDWRITING_FONTS.find((f) => f.id === font)?.family }}
      >
        {HANDWRITING_FONTS.map((f) => (
          <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onExport(color, font)}
        className="rounded-md bg-indigo-600 px-2.5 py-1 font-medium text-white hover:bg-indigo-700"
      >
        Export to board
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="px-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        &times;
      </button>
    </div>
  );
}
