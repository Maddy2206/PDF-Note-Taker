"use client";

import type { Board } from "@/lib/types";

export const LINE_SPACING = 40;
export const MARGIN_X = -80;

export type PaperView = { scrollX: number; scrollY: number; zoom: number };

export default function PaperBackground({
  paper,
  view,
}: {
  paper: Board["paper"];
  view: PaperView;
}) {
  if (paper !== "lined") {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: "#ffffff" }}
      />
    );
  }
  const z = view.zoom;
  const step = LINE_SPACING * z;
  const line = "rgba(96, 140, 200, 0.35)";
  const margin = "rgba(220, 80, 80, 0.45)";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundColor: "#fffdf8",
        backgroundImage: `linear-gradient(to bottom, transparent ${step - 1.5}px, ${line} ${step - 1.5}px), linear-gradient(to right, ${margin} 2px, transparent 2px)`,
        backgroundSize: `100% ${step}px, 2px 100%`,
        backgroundRepeat: "repeat-y, no-repeat",
        backgroundPosition: `0 ${view.scrollY * z}px, ${(MARGIN_X + view.scrollX) * z}px 0`,
      }}
    />
  );
}
