"use client";

import type { Board } from "@/lib/types";
import { LINE, MARGIN_LINE_X, PAGE_H, PAGE_W, STRIDE } from "@/lib/pages";

export type PaperView = { scrollX: number; scrollY: number; zoom: number };

/**
 * The "desk" and the notebook pages, drawn behind the transparent Excalidraw
 * canvas. Everything follows Excalidraw's pan and zoom.
 */
export default function PaperBackground({
  paper,
  view,
  pages,
}: {
  paper: Board["paper"];
  view: PaperView;
  pages: number;
}) {
  const z = view.zoom;
  const step = LINE * z;
  const lined = paper === "lined";
  const rule = "rgba(96, 140, 200, 0.35)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-zinc-300">
      {Array.from({ length: pages }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: view.scrollX * z,
            top: (i * STRIDE + view.scrollY) * z,
            width: PAGE_W * z,
            height: PAGE_H * z,
            backgroundColor: lined ? "#fffdf8" : "#ffffff",
            boxShadow: "0 1px 8px rgba(0,0,0,0.25)",
            ...(lined
              ? {
                  backgroundImage: `linear-gradient(to bottom, transparent ${step - 1.5}px, ${rule} ${step - 1.5}px)`,
                  backgroundSize: `100% ${step}px`,
                }
              : {}),
          }}
        >
          {lined && (
            <div
              className="absolute top-0 h-full"
              style={{
                left: MARGIN_LINE_X * z,
                width: Math.max(1, 1.5 * z),
                background: "rgba(220, 80, 80, 0.45)",
              }}
            />
          )}
          <span
            className="absolute bottom-1 right-2 select-none text-zinc-400"
            style={{ fontSize: Math.max(9, 14 * z) }}
          >
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
