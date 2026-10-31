# Architecture

Client-only Next.js (App Router) app. There is no backend, API or authentication; all data lives in the browser. Versions are in [package.json](../package.json). This Next.js version differs from older ones: see `node_modules/next/dist/docs/`.

## Layout

| Path | Role |
| --- | --- |
| `app/page.tsx` | Landing page (`components/landing/Landing.tsx`) |
| `app/dashboard/page.tsx` | Board library (`components/dashboard/`) |
| `app/board/[id]/page.tsx` | Workspace: owns state and wires the PDF and notes sides together |
| `components/pdf/` | `PdfViewer` (pdf.js rendering, highlights), `PdfTabs`, `SelectionPopout`, `DiagramSelect` |
| `components/notes/` | `NotesCanvas` (Excalidraw wrapper, autosave), toolbar, inline editor, paper background, helpers |
| `components/workspace/SplitLayout.tsx` | Resizable PDF/notes split |
| `components/focus/` | Focus mode: `useFocusSession` (state, saving, fullscreen, absence detection, chime), `FocusSetupDialog`, `FocusBar`, `FocusOverlay`, `HoldToExit`, `useNow` |
| `lib/` | `storage.ts` (IndexedDB), `types.ts`, `export-pdf.ts`, `note-image.ts`, `diagram-region.ts`, `paper.ts`, `pages.ts`, `placement.ts`, `handwriting-fonts.ts`, `pdf-validate.ts`, `visible-page.ts`, `note-source.ts`, `focus.ts` (pure session/timer/stats logic) |

## Data flow

1. Uploaded PDFs are checked by `lib/pdf-validate.ts` and stored as Blobs.
2. `PdfViewer` renders pages with pdf.js (legacy build, worker resolved via `new URL(...)`).
3. Selecting text opens `SelectionPopout` (marker colour, font). On export, `lib/note-image.ts` draws the text on a canvas in the handwriting font; the PNG is inserted into the Excalidraw scene at a position from `lib/placement.ts`, and a `Highlight` record links to it by `noteId`.
4. Diagram clip: `DiagramSelect` + `lib/diagram-region.ts` rasterize a page region into an image element. The image's `customData.source` (`NoteSource`: docId, page, rect in 0-1 page units) records where it came from.
5. Go to source: selecting a note makes `NotesCanvas` call `lib/note-source.ts` (`resolveNoteSource`: diagram -> `customData.source`; text note -> `customData.source` if stamped, else the union box of its `Highlight` by `noteId`; removing a highlight stamps the source onto the note first). The button calls `jumpToSource` in the board page, which switches the PDF tab, shows the pane and passes `jump` to `PdfViewer`; that scrolls to the rect and flashes it.
5. `NotesCanvas` (loaded with `dynamic()`) autosaves the whole scene to IndexedDB on an 800 ms debounce.
6. Download: `lib/export-pdf.ts` (loaded on demand) draws the paper and scene per notebook page and writes a JPEG-per-page A4 PDF with jsPDF.

## Storage (`lib/storage.ts`, via `idb`)

IndexedDB `pdf-note-taker`, version 3. Stores: `boards`, `highlights` (indexed by board), `scenes` (keyed by `boardId`), `documents` (index `by-board`), `pdfBlobs` (keyed by `docId`), `focusSessions` (keyed by `id`, not deleted with a board). The v1 to v2 upgrade moved the old single-PDF store into `documents` and `pdfBlobs`; v3 added `focusSessions`, and the connection closes on `blocking` so a second tab can't stall an upgrade. localStorage holds only the last-used ink, font, marker and focus timer choice (`pdfnote.*` keys).

## Focus mode

`app/board/[id]/page.tsx` owns `useFocusSession(boardId)`. A session is one `FocusSession` record saved on every change; phases store `phaseEndsAt` timestamps, so reloads, sleep and throttled tabs stay accurate and an active session is resumed on load (shown behind "Back to focus", since full screen needs a click). `FocusBar` and `FocusOverlay` tick locally (`useNow`) so the board doesn't re-render each second. Absence = hidden tab, window blur or lost full screen, still true after 400 ms. The page reports PDF page changes, exported highlights and clipped diagrams into the session; `lib/focus.ts#focusStats` feeds the dashboard strip.

## Build notes

- The only environment variable read is `NEXT_DIST_DIR` (build output folder, default `.next`, see `next.config.ts`).
- Tailwind is wired through a Turbopack CSS rule in `next.config.ts` (no PostCSS config); a non-Turbopack build is untested.
- No tests, CI or deployment config exist in the repo.
