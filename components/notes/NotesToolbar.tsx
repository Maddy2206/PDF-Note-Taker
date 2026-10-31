"use client";

import { useRef, useState, type ReactNode } from "react";
import { useDismiss } from "@/components/ui/useDismiss";
import { INK_COLORS, type FontId } from "@/lib/handwriting-fonts";
import FontPicker from "@/components/ui/FontPicker";

export type NoteTool =
  | "hand"
  | "selection"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser";

const icon = (paths: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {paths}
  </svg>
);

const TOOLS: { id: NoteTool; label: string; key: string; icon: ReactNode }[] = [
  { id: "hand", label: "Pan", key: "H", icon: icon(<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />) },
  { id: "selection", label: "Select", key: "1", icon: icon(<path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.12 1.58a2 2 0 0 0-1.44 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" />) },
  { id: "rectangle", label: "Rectangle", key: "2", icon: icon(<rect width="18" height="18" x="3" y="3" />) },
  { id: "diamond", label: "Diamond", key: "3", icon: icon(<path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />) },
  { id: "ellipse", label: "Ellipse", key: "4", icon: icon(<circle cx="12" cy="12" r="9" />) },
  { id: "arrow", label: "Arrow", key: "5", icon: icon(<path d="M5 12h14m-7-7 7 7-7 7" />) },
  { id: "line", label: "Line", key: "6", icon: icon(<path d="M4 20 20 4" />) },
  { id: "freedraw", label: "Pen", key: "7", icon: icon(<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" />) },
  { id: "text", label: "Text", key: "8", icon: icon(<path d="M4 7V4h16v3M9 20h6M12 4v16" />) },
  { id: "image", label: "Image", key: "9", icon: icon(<><rect width="18" height="18" x="3" y="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" /></>) },
  { id: "eraser", label: "Eraser", key: "0", icon: icon(<><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7M5 11l9 9" /></>) },
];

const GAP_AFTER = new Set<NoteTool>(["hand", "line", "image"]);

/** The notes pane's tool row: drawing tools, ink color and handwriting font. */
export default function NotesToolbar({
  tool,
  onTool,
  locked,
  onLock,
  ink,
  onInk,
  fontId,
  onFont,
  disabled,
}: {
  tool: NoteTool;
  onTool: (t: NoteTool) => void;
  locked: boolean;
  onLock: () => void;
  ink: string;
  onInk: (c: string) => void;
  fontId: FontId;
  onFont: (f: FontId) => void;
  disabled?: boolean;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRoot = useRef<HTMLDivElement>(null);

  useDismiss(colorOpen, colorRoot, () => setColorOpen(false));

  const sep = <span className="mx-1.5 h-[22px] w-px flex-none bg-[var(--color-divider)]" aria-hidden />;

  return (
    <div className="flex min-h-11 flex-none flex-wrap items-center gap-1 border-b border-[var(--color-divider)] px-1.5 py-0.5">
      <button
        onClick={onLock}
        aria-pressed={locked}
        aria-label={locked ? "Unlock notebook" : "Lock notebook"}
        title={locked ? "Unlock notebook" : "Lock notebook"}
        className="btn btn-icon !h-8 !w-8 flex-none aria-pressed:text-[var(--color-accent)]"
      >
        {locked
          ? icon(<><rect width="18" height="11" x="3" y="11" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>)
          : icon(<><rect width="18" height="11" x="3" y="11" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>)}
      </button>
      {sep}
      {TOOLS.map((t) => (
        <span key={t.id} className="flex flex-none items-center gap-1">
          <button
            onClick={() => onTool(t.id)}
            aria-pressed={tool === t.id}
            aria-label={t.label}
            title={`${t.label} (${t.key})`}
            disabled={locked || disabled}
            className="btn btn-icon relative !h-8 !w-8 flex-none aria-pressed:!bg-[var(--color-accent)] aria-pressed:text-[var(--color-bg)]"
          >
            {t.icon}
            <span aria-hidden className="absolute bottom-0 right-0.5 text-[9px] leading-none opacity-70">
              {t.key === "H" ? "" : t.key}
            </span>
          </button>
          {GAP_AFTER.has(t.id) && sep}
        </span>
      ))}
      {sep}
      <div ref={colorRoot} className="relative flex-none">
        <button
          onClick={() => setColorOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={colorOpen}
          aria-label="Ink color"
          className="flex h-8 w-[52px] flex-none items-center justify-center gap-1.5 border border-[var(--color-divider)] bg-[var(--color-bg)] p-0 hover:bg-[var(--color-surface)]"
        >
          <span
            className="block size-4 flex-none border border-black/30"
            style={{ background: ink, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)" }}
            aria-hidden
          />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {colorOpen && (
          <div
            role="listbox"
            aria-label="Ink color"
            className="absolute left-0 top-[38px] z-40 border-2 border-[var(--color-text)] bg-[var(--color-bg)] p-2 shadow-[var(--shadow-lg)]"
            style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: 6 }}
          >
            {INK_COLORS.map((c) => (
              <button
                key={c.id}
                role="option"
                aria-selected={ink === c.value}
                aria-label={c.label}
                title={c.label}
                onClick={() => {
                  onInk(c.value);
                  setColorOpen(false);
                }}
                className="border border-black/30"
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  background: c.value,
                  cursor: "pointer",
                  outline: ink === c.value ? "2px solid var(--color-text)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <span className="w-1 flex-none" aria-hidden />
      <div className="flex-none">
        <FontPicker value={fontId} onChange={onFont} />
      </div>
    </div>
  );
}
