"use client";

import { PAPERS, PAPER_COLORS } from "@/lib/paper";
import type { Paper } from "@/lib/types";
import PaperPreview from "./PaperPreview";

const heading =
  "mb-1.5 text-[11px] uppercase tracking-[0.08em] text-[var(--color-accent-700)]";

/** Page type tiles (each a mini page), page colors and a larger live preview. */
export default function PageStylePicker({
  paper,
  color,
  onChange,
}: {
  paper: Paper;
  color: string;
  onChange: (paper: Paper, color: string) => void;
}) {
  return (
    <div style={{ color: "#000" }}>
      <div className={heading}>Page type</div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {PAPERS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={paper === p.id}
            onClick={() => onChange(p.id, color)}
            className="flex flex-col items-stretch gap-1 p-1 text-xs hover:bg-zinc-100 aria-pressed:bg-[var(--color-accent-100)] aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-[var(--color-accent)]"
          >
            <PaperPreview paper={p.id} color={color} step={12} className="h-20 w-full" />
            <span className="font-semibold">{p.label}</span>
          </button>
        ))}
      </div>
      <div className={heading}>Page color</div>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {PAPER_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            aria-label={c.label}
            aria-pressed={color.toLowerCase() === c.value}
            onClick={() => onChange(paper, c.value)}
            style={{ background: c.value }}
            className="h-10 border border-black/30 aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-[var(--color-accent)]"
          />
        ))}
      </div>
      <div className={heading}>Preview</div>
      <PaperPreview paper={paper} color={color} step={26} sample className="h-48 w-full shadow-sm" />
    </div>
  );
}
