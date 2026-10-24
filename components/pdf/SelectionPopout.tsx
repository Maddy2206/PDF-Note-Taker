"use client";

import { MARKER_COLORS } from "@/lib/handwriting-fonts";

interface Props {
  x: number;
  y: number;
  /** Current note color and handwriting font, chosen in the toolbar above the PDF. */
  color: string;
  /** Light color of the highlight drawn over the PDF text. */
  marker: string;
  onMarker: (c: string) => void;
  fontLabel: string;
  fontFamily: string;
  onExport: () => void;
  onDismiss: () => void;
}

const HALF_WIDTH = 290; // about half the popout's width

/** Appears next to selected PDF text; one click sends it to the notes. */
export default function SelectionPopout({
  x,
  y,
  color,
  marker,
  onMarker,
  fontLabel,
  fontFamily,
  onExport,
  onDismiss,
}: Props) {
  return (
    <div
      // keep the text selection alive while using the popout
      onMouseDown={(e) => e.preventDefault()}
      style={{
        left: Math.min(Math.max(x, HALF_WIDTH), window.innerWidth - HALF_WIDTH),
        top: Math.min(y, window.innerHeight - 90),
      }}
      className="fixed z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-base text-black shadow-xl"
      role="dialog"
      aria-label="Highlight options"
    >
      <div className="flex items-center gap-1.5" role="listbox" aria-label="Highlight color">
        {MARKER_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={marker === c.value}
            aria-label={`${c.label} highlight`}
            title={`${c.label} highlight`}
            onClick={() => onMarker(c.value)}
            className="h-6 w-6 shrink-0 rounded-full border border-black/25"
            style={{
              background: c.value,
              outline: marker === c.value ? "2px solid #111827" : "none",
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
      <div
        className="flex items-center gap-2 text-zinc-900"
        title="Change the text color and font in the toolbar above the notes"
      >
        <span
          className="h-6 w-6 shrink-0 rounded-full border border-black/25"
          style={{ background: color }}
          aria-hidden
        />
        <span className="text-xl leading-none" style={{ fontFamily }}>
          {fontLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-indigo-700"
      >
        Export to board
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="px-1.5 text-2xl leading-none text-zinc-500 hover:text-zinc-800"
      >
        &times;
      </button>
    </div>
  );
}
