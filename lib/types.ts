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

/** Where a note came from in the PDF. Rect is in 0-1 page units. */
export interface NoteSource {
  docId: string;
  page: number;
  rect: HighlightRect;
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

export type FocusStatus = "active" | "completed" | "ended-early";

/** One Pomodoro-style focus session on a board. Times are epoch ms. */
export interface FocusSession {
  id: string;
  boardId: string;
  startedAt: number;
  endedAt?: number;
  status: FocusStatus;
  goal?: string;
  /** Optional reading target: a page range in one PDF. */
  target?: { docId: string; fromPage: number; toPage: number };
  focusMinutes: number;
  breakMinutes: number;
  rounds: number;
  /** Current round, 1-based. */
  round: number;
  phase: "focus" | "break";
  phaseStartedAt: number;
  phaseEndsAt: number;
  /** Focus time already credited from finished or ended phases. */
  focusedMs: number;
  awayCount: number;
  /** Distinct "docId:page" keys opened during the session. */
  pagesSeen: string[];
  highlightsAdded: number;
  diagramsAdded: number;
}

/** The saved Excalidraw notes for a board. */
export interface SceneRecord {
  boardId: string;
  elements: unknown[];
  files: Record<string, unknown>;
  appState: Record<string, unknown>;
}
