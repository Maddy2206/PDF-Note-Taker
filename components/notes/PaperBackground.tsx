"use client";

import type { Board } from "@/lib/types";
import { LINE, MARGIN_LINE_X, PAGE_H, PAGE_W, STRIDE } from "@/lib/pages";
import { MARGIN, paperColorOf, paperCss } from "@/lib/paper";

export type PaperView = { scrollX: number; scrollY: number; zoom: number };

/**
 * The "desk" and the notebook pages, drawn behind the transparent Excalidraw
 * canvas. Everything follows Excalidraw's pan and zoom.
 */
export default function PaperBackground({
  paper,
  color,
  view,
  pages,
}: {
  paper: Board["paper"];
  color?: string;
  view: PaperView;
  pages: number;
}) {
  const z = view.zoom;
  const step = LINE * z;
  const fill = paperColorOf(paper, color);
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
            boxShadow: "0 1px 8px rgba(0,0,0,0.25)",
            ...paperCss(paper, fill, step),
          }}
        >
          {paper === "lined" && (
            <div
              className="absolute top-0 h-full"
              style={{
                left: MARGIN_LINE_X * z,
                width: Math.max(1, 1.5 * z),
                background: MARGIN,
              }}
            />
          )}
          <span
            className="absolute bottom-1 right-2 select-none text-zinc-500"
            style={{ fontSize: Math.max(9, 14 * z) }}
          >
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
