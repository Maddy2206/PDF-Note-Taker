import type { Paper } from "./types";
import { LINE, MARGIN_LINE_X } from "./pages";

export const PAPERS: { id: Paper; label: string }[] = [
  { id: "lined", label: "Lined" },
  { id: "dotted", label: "Dotted" },
  { id: "grid", label: "Grid" },
  { id: "blank", label: "Blank" },
];

export const PAPER_COLORS: { id: string; label: string; value: string }[] = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "cream", label: "Cream", value: "#fffdf8" },
  { id: "sunshine", label: "Sunshine", value: "#fff08a" },
  { id: "lime", label: "Lime", value: "#d9f99d" },
  { id: "mint", label: "Mint", value: "#a7f3d0" },
  { id: "sky", label: "Sky", value: "#bae6fd" },
  { id: "lavender", label: "Lavender", value: "#ddd6fe" },
  { id: "pink", label: "Pink", value: "#fbcfe8" },
  { id: "peach", label: "Peach", value: "#fed7aa" },
  { id: "coral", label: "Coral", value: "#fecaca" },
];

/** Colors used before page colors existed: lined pages were cream, blank ones white. */
export function paperColorOf(paper: Paper, color?: string): string {
  return color ?? (paper === "lined" ? "#fffdf8" : "#ffffff");
}

export const RULE = "rgba(70, 110, 180, 0.38)";
export const MARGIN = "rgba(220, 60, 60, 0.5)";

/** CSS background for one notebook page on screen; `step` is one row in pixels. */
export function paperCss(paper: Paper, color: string, step: number): React.CSSProperties {
  const line = Math.max(1, step / 26);
  switch (paper) {
    case "lined":
      return {
        backgroundColor: color,
        backgroundImage: `linear-gradient(to bottom, transparent ${step - line}px, ${RULE} ${step - line}px)`,
        backgroundSize: `100% ${step}px`,
      };
    case "grid":
      return {
        backgroundColor: color,
        backgroundImage: `linear-gradient(to bottom, transparent ${step - line}px, ${RULE} ${step - line}px), linear-gradient(to right, transparent ${step - line}px, ${RULE} ${step - line}px)`,
        backgroundSize: `${step}px ${step}px`,
      };
    case "dotted":
      return {
        backgroundColor: color,
        backgroundImage: `radial-gradient(circle, rgba(70, 110, 180, 0.75) ${Math.max(1, step / 22)}px, transparent ${Math.max(1.2, step / 22) + 0.6}px)`,
        backgroundSize: `${step}px ${step}px`,
        backgroundPosition: `${-step / 2}px ${-step / 2}px`,
      };
    default:
      return { backgroundColor: color };
  }
}

/** Paints one page of paper onto a canvas; `k` is canvas pixels per page unit. */
export function drawPaper(
  ctx: CanvasRenderingContext2D,
  paper: Paper,
  color: string,
  w: number,
  h: number,
  k: number,
  pageW: number,
  pageH: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = Math.max(1, k);
  ctx.strokeStyle = RULE;
  if (paper === "lined" || paper === "grid") {
    for (let y = LINE; y <= pageH; y += LINE) {
      ctx.beginPath();
      ctx.moveTo(0, y * k);
      ctx.lineTo(w, y * k);
      ctx.stroke();
    }
  }
  if (paper === "grid") {
    for (let x = LINE; x <= pageW; x += LINE) {
      ctx.beginPath();
      ctx.moveTo(x * k, 0);
      ctx.lineTo(x * k, h);
      ctx.stroke();
    }
  }
  if (paper === "dotted") {
    ctx.fillStyle = "rgba(70, 110, 180, 0.75)";
    for (let y = 0; y <= pageH; y += LINE) {
      for (let x = 0; x <= pageW; x += LINE) {
        ctx.beginPath();
        ctx.arc(x * k, y * k, Math.max(1, 1.6 * k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (paper === "lined") {
    ctx.strokeStyle = MARGIN;
    ctx.beginPath();
    ctx.moveTo(MARGIN_LINE_X * k, 0);
    ctx.lineTo(MARGIN_LINE_X * k, h);
    ctx.stroke();
  }
}
