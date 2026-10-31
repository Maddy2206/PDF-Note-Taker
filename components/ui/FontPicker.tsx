"use client";

import { useRef, useState } from "react";
import { useDismiss } from "@/components/ui/useDismiss";
import { HANDWRITING_FONTS, getFont, type FontId } from "@/lib/handwriting-fonts";

/** A dropdown that shows every font name written in its own handwriting. */
export default function FontPicker({
  value,
  onChange,
}: {
  value: FontId;
  onChange: (id: FontId) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = getFont(value);

  useDismiss(open, root, () => setOpen(false));

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Handwriting font: ${current.label}`}
        style={{ fontFamily: current.family }}
        className="flex items-center gap-2 border border-[var(--color-divider)] bg-white px-2.5 py-0.5 text-lg leading-tight !text-black hover:bg-zinc-100"
      >
        {current.label}
        <span aria-hidden className="font-sans text-xs text-zinc-500">
          &#9662;
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 flex max-h-80 w-60 max-w-[calc(100vw-2rem)] flex-col gap-0.5 overflow-y-auto border border-[var(--color-divider)] bg-white p-1.5 text-black shadow-[var(--shadow-md)]"
        >
          {HANDWRITING_FONTS.map((f) => (
            <li key={f.id} role="option" aria-selected={f.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(f.id);
                  setOpen(false);
                }}
                style={{ fontFamily: f.family }}
                className="w-full bg-white px-3 py-1.5 text-left text-xl leading-tight !text-black hover:bg-zinc-100 data-[selected=true]:bg-zinc-200"
                data-selected={f.id === value}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
