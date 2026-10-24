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
  const first = highlights
    .filter((h) => h.noteId === element.id && docIds.includes(h.docId) && h.rects.length)
    .sort((a, b) => a.page - b.page)[0];
  return first ? { docId: first.docId, page: first.page, rect: first.rects[0] } : null;
}
