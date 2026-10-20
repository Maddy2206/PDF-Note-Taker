export type Paper = "lined" | "blank";

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
  /** PDF zoom factor; null/undefined means fit to the pane width. */
  pdfZoom?: number | null;
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
  page: number;
  rects: HighlightRect[];
  color: string;
  text: string;
  font: string;
}

/** The saved Excalidraw notes for a board. */
export interface SceneRecord {
  boardId: string;
  elements: unknown[];
  files: Record<string, unknown>;
  appState: Record<string, unknown>;
}
