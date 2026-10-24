import type { Highlight, NoteSource } from "./types";

/** The PDF location a board element came from, or null if it has none. */
export function resolveNoteSource(
  element: { id: string; customData?: Record<string, unknown> },
  highlights: Highlight[],
  docIds: string[],
): NoteSource | null {
  const data = element.customData;
  if (data?.kind === "diagram") {
    const s = data.source as NoteSource | undefined;
    return s && docIds.includes(s.docId) ? s : null;
  }
  if (data?.kind === "handwritten-note" && data.source) {
    const s = data.source as NoteSource;
    if (docIds.includes(s.docId)) return s;
  }
  const first = highlights
    .filter((h) => h.noteId === element.id && docIds.includes(h.docId) && h.rects.length)
    .sort((a, b) => a.page - b.page)[0];
  return first ? sourceOf(first) : null;
}

/** One box around every line of a highlight on its page, so a jump focuses the whole text. */
export function sourceOf(h: Highlight): NoteSource {
  const x = Math.min(...h.rects.map((r) => r.x));
  const y = Math.min(...h.rects.map((r) => r.y));
  const right = Math.max(...h.rects.map((r) => r.x + r.w));
  const bottom = Math.max(...h.rects.map((r) => r.y + r.h));
  return { docId: h.docId, page: h.page, rect: { x, y, w: right - x, h: bottom - y } };
}
