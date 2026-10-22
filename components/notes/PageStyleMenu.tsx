"use client";

import { useEffect, useRef, useState } from "react";
import PageStylePicker from "@/components/ui/PageStylePicker";
import type { Paper } from "@/lib/types";

/** Header dropdown to change the notebook's page type and page color at any time. */
export default function PageStyleMenu({
  paper,
  color,
  onChange,
}: {
  paper: Paper;
  color: string;
  onChange: (paper: Paper, color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="btn btn-secondary gap-2"
      >
        <span className="h-4 w-4 border border-black/30" style={{ background: color }} aria-hidden />
        Page style
        <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Page style"
          className="absolute right-0 top-full z-50 mt-1 w-[26rem] max-w-[calc(100vw-1rem)] border border-[var(--color-divider)] bg-white p-3 text-black shadow-[var(--shadow-md)]"
        >
          <PageStylePicker paper={paper} color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
