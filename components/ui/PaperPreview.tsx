import { paperColorOf, paperCss, MARGIN } from "@/lib/paper";
import { getFont } from "@/lib/handwriting-fonts";
import type { Paper } from "@/lib/types";

/** A small picture of a notebook page: its type, its color and a line of handwriting. */
export default function PaperPreview({
  paper,
  color,
  step = 12,
  sample = false,
  className = "",
}: {
  paper: Paper;
  color?: string;
  /** Height of one row in pixels. */
  step?: number;
  sample?: boolean;
  className?: string;
}) {
  const font = getFont("caveat");
  return (
    <div
      className={`relative overflow-hidden border border-black/25 ${className}`}
      style={paperCss(paper, paperColorOf(paper, color), step)}
    >
      {paper === "lined" && (
        <span
          className="absolute top-0 h-full"
          style={{ left: step * 1.1, width: 1, background: MARGIN }}
        />
      )}
      {sample && (
        <span
          className="absolute"
          style={{
            left: step * 1.6,
            top: step * 0.05,
            right: step * 0.5,
            fontFamily: font.family,
            fontSize: step * 0.95,
            lineHeight: `${step}px`,
            color: "#111827",
          }}
        >
          Photosynthesis converts light energy into chemical energy.
          <br />
          The Calvin cycle fixes carbon dioxide into sugars.
        </span>
      )}
    </div>
  );
}
