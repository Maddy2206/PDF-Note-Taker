export type Paper = "lined" | "blank" | "dotted" | "grid";

export interface PaneVisibility {
  pdf: boolean;
  notes: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: number;
  lastOpenedAt: number;
  pageCount: number;
  lastPage: number;
  /** Fraction (0-1) of the width given to the PDF pane. */
  dividerRatio: number;
  paneVisibility: PaneVisibility;
  paper: Paper;
  /** Page color as a hex string; undefined means the original default for the paper. */
  paperColor?: string;
  /** Number of notebook pages in the notes pane (undefined means 1). */
  notePages?: number;
  /** PDF zoom factor; null/undefined means fit to the pane width. (Legacy: now kept per PDF.) */
  pdfZoom?: number | null;
  /** The PDF tab that was open last (defaults to the first PDF). */
  activeDocId?: string;
  /** How many PDFs the board holds (undefined means 1). */
  docCount?: number;
}

/** One PDF inside a board. The file itself is stored separately, so listing stays cheap. */
export interface PdfDoc {
  id: string;
  boardId: string;
  name: string;
  pageCount: number;
  lastPage: number;
  /** Zoom factor; null means fit to the pane width. */
  zoom: number | null;
  addedAt: number;
}

export interface HighlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A highlight on the PDF. Rects are in 0-1 page units so they survive zoom. */
export interface Highlight {
  id: string;
  boardId: string;
  /** The PDF the highlight belongs to. */
  docId: string;
  page: number;
  rects: HighlightRect[];
  color: string;
  text: string;
  font: string;
  /** The exported note on the board, so removing the highlight can remove it too. */
  noteId?: string;
}

/** The saved Excalidraw notes for a board. */
export interface SceneRecord {
  boardId: string;
  elements: unknown[];
  files: Record<string, unknown>;
  appState: Record<string, unknown>;
}
