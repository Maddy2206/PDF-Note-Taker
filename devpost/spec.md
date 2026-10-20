---
doc: spec
status: approved
---

# PDF Note taker — Technical Spec

## How This Works, In Plain Language
PDF Note taker is a website that runs entirely in your browser. There is no server holding your data and no login.

- **The Dashboard page** lists your boards as cards. A "board" is one PDF plus the notes you took on it.
- **The Board page** has two halves. On the left, a PDF reader (built with a library called pdf.js) draws each page and also lays an invisible layer of real text on top, which is what lets you select words. On the right is the notes area, built on Excalidraw, a drawing canvas you can place text, images and drawings on and then move, resize and delete.
- **When you select text** in the PDF, a small popout appears. When you press Export, the app takes the exact words you selected and puts them on the notes canvas in a handwriting font, just below whatever is already there.
- **When you use the diagram tool**, you drag a dotted rectangle on the PDF page. The app copies that rectangle of the page as a picture and drops it onto the notes canvas, where it behaves like any other item.
- **Saving** works like a sticky note the browser keeps: the app keeps your PDF, your highlights and your notes in the browser's built-in database (IndexedDB). Reopen a board and the app reads it all back.
- **Download** turns the notes canvas into a picture and wraps it in a PDF file.

Why this shape: no accounts and no backend means nothing to host, nothing to log into, and no cost. The trade-off is that your boards live in the browser you made them in, on that device.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Dashboard** (`/dashboard`) → app reads all boards from IndexedDB `boards` store → shows cards (name, last reopened).
2. **Create board** → user picks a name and a file → app checks it is a PDF (file type and the `%PDF-` header) → rejects with a message otherwise → stores the file as a Blob in `pdfs`, creates the board record → navigates to `/board/[id]`.
3. **Board page** → loads board record, PDF Blob, highlights, and saved notes scene → pdf.js renders pages; Excalidraw loads the saved scene; panes sized from the saved divider ratio.
4. **Select text** → the browser selection over the pdf.js text layer is read → popout appears (color, font, Export) → color applies a highlight rectangle on the PDF and saves a highlight record.
5. **Export to board** → the app computes the next free spot on the canvas → adds a handwritten note element carrying the exact text and the chosen font → autosave.
6. **Diagram tool** → drag a dotted rectangle over a PDF page → app re-renders that region at high resolution to a PNG → adds an image element to the canvas at the next free spot → autosave.
7. **Own notes** → Excalidraw's own toolbar (pen, shapes, colors, text, eraser, undo/redo).
8. **Autosave** (debounced, a second or so after changes) writes the notes scene, highlights, divider position, pane visibility, paper style and PDF page to IndexedDB, and sets `lastOpenedAt` when the board opens.
9. **Download** → Excalidraw exports the scene to a canvas → sliced into pages → written with jsPDF → browser downloads `<board name>.pdf`.

## Stack
Versions are not verified (no lookup done in this session); pin whatever `npm install` resolves and record it in `package.json`. Verify compatibility early in the build.

| Piece | Choice | Docs | Why |
|---|---|---|---|
| Framework | Next.js (App Router) + TypeScript | https://nextjs.org/docs | Learner accepted; React, easy Vercel deploy |
| Styling | Tailwind CSS | https://tailwindcss.com/docs | Default AI-app look, fast to build (`prd.md > Look and Feel`) |
| PDF reading | pdfjs-dist (pdf.js) | https://mozilla.github.io/pdf.js/ | Page rendering and text layer for selection |
| Notes canvas | @excalidraw/excalidraw | https://docs.excalidraw.com/ | Drawing, shapes, move/resize, undo/redo, export |
| Storage | idb (IndexedDB wrapper) | https://github.com/jakearchibald/idb | Local, no backend; handles PDF Blobs |
| Split panes | react-resizable-panels | https://github.com/bvaughn/react-resizable-panels | Draggable divider and collapsible panes |
| PDF export | jsPDF | https://github.com/parallax/jsPDF | Wrap the exported canvas into a PDF |
| Handwriting fonts | Google Fonts via `next/font` (e.g. Caveat, Kalam, Patrick Hand, Indie Flower) | https://nextjs.org/docs/app/api-reference/components/font | Several handwriting looks, loaded locally at build time |

Known integration points to check first: Excalidraw must be loaded client-side only (dynamic import, `ssr: false`) and needs its CSS imported; pdf.js needs its worker file served; check both on `npm run dev` and on the Vercel build.

## Where It Runs and How Someone Tries It
- **Runtime:** the browser. Development needs Node.js (this machine has v24) and npm.
- **Start:** `npm install` then `npm run dev`, open `http://localhost:3000` (redirects to `/dashboard`).
- **Demo recording flow:** create a board, upload a sample PDF, drag the divider, highlight a sentence → export → see it handwritten, clip a diagram, draw something, reload to show it saved, download the PDF.
- **Deployment (learner's choice):** Vercel. Push the repo to GitHub (the learner creates the repo and pushes), import it in Vercel, accept the Next.js defaults. No environment variables or keys. Because storage is per-browser, a visitor to the live link starts with no boards and uploads their own PDF; the required demo video and public GitHub repo are still needed in addition (`6-ship`).

## Look and Feel
PRD ref: `prd.md > Look and Feel`. The learner chose the default clean AI-app look: neutral palette, rounded cards, system sans-serif UI text, light and dark mode where cheap. The distinctive parts are the handwriting fonts and the notes surface: lined or blank "paper" (lined = CSS background lines that follow the canvas pan and zoom, or fall back to fixed lines if that proves fiddly). Interface copy: short, plain, friendly.

## Components

### Dashboard
Card grid of boards from IndexedDB; Create board dialog (name + PDF upload with type check); rename and delete (confirm) on each card; click opens the board. First-use empty state.
PRD ref: `prd.md > Dashboard cards`, `prd.md > Create board and upload`.

### Board Workspace Shell
Loads the board and mounts the two panes inside a resizable-panels group: draggable divider, a close/reopen control for each pane, ratio and visibility saved on the board. Hosts the autosave.
PRD ref: `prd.md > Split workspace`.

### PDF Viewer
pdf.js page rendering (canvas plus text layer), page scrolling, zoom, and overlays for saved highlights. Detects PDFs with no text and shows a banner.
PRD ref: `prd.md > Highlight to handwritten note`, `prd.md > States and Boundaries`.

### Selection Popout
Appears near selected text: color choices, font choices, Export to board. Converts the selection into rectangles in page coordinates (stored so highlights survive zoom and reload).
PRD ref: `prd.md > Highlight to handwritten note`.

### Diagram Select Tool
A toolbar toggle on the PDF pane. While active, dragging draws a dotted rectangle; on release, the region is rendered at 2x-3x to a PNG and offered "Import to notes".
PRD ref: `prd.md > Diagram import`.

### Notes Canvas
Excalidraw embedded with its toolbar. Receives items from the two components above through its API (`updateScene`, `addFiles`), with paper style (lined/blank), autosave, and the Download button.
PRD ref: `prd.md > Notes tools`.

### Handwritten Note Element
How the exact highlighted words appear in the chosen handwriting font. **Preferred:** a native Excalidraw text element, if the installed version supports custom font families (check first). **Fallback:** render the text to an image with the chosen font and insert it as an image element whose `customData` keeps `{text, font, color}`; double-click opens a small edit box that re-renders the image. Either way the item can be moved, resized and deleted, and the text stays editable.
PRD ref: `prd.md > Highlight to handwritten note` ("can be edited, moved, resized, deleted").

### Next-Free-Spot Placement
New items go below the lowest existing element on the canvas (plus a gap), left-aligned to a margin. Simple, predictable, and testable.
PRD ref: `prd.md > Highlight to handwritten note`.

### Storage Layer
A small module wrapping idb: `listBoards`, `createBoard`, `getBoard`, `updateBoard`, `deleteBoard`, `saveScene`, `loadScene`, `saveHighlights`, `loadHighlights`. All other components go through it.
PRD ref: `prd.md > Save, resume, download`.

### PDF Export
Exports the scene to a canvas (Excalidraw's export helper), paints lines if the paper is lined, slices into page-height strips, writes them with jsPDF, downloads.
PRD ref: `prd.md > Save, resume, download`.

## Data Model
All data lives in the browser's IndexedDB (database `pdf-note-taker`). Each store is read when its board opens and written by debounced autosave; nothing is lost on reload.

- **boards** `{ id, name, createdAt, lastOpenedAt, pageCount, lastPage, dividerRatio, paneVisibility {pdf, notes}, paper: "lined" | "blank" }`
- **pdfs** `{ boardId, blob }`: the uploaded PDF file.
- **highlights** `{ id, boardId, page, rects[{x,y,w,h} in 0-1 page units], color, text, font }`
- **scenes** `{ boardId, elements, files, appStateSubset }`: the Excalidraw notes (scroll and zoom included).

Leaving and coming back: opening a board reloads all four. Deleting a board deletes its rows in every store.

## File Structure
```
project/
├── app/
│   ├── layout.tsx               # fonts, global styles
│   ├── page.tsx                 # redirects to /dashboard (landing page goes here last)
│   ├── dashboard/page.tsx       # Dashboard
│   └── board/[id]/page.tsx      # Board Workspace Shell (client component)
├── components/
│   ├── dashboard/               # BoardCard, CreateBoardDialog
│   ├── workspace/               # SplitLayout, PaneControls
│   ├── pdf/                     # PdfViewer, TextLayer, HighlightOverlay, SelectionPopout, DiagramSelect
│   └── notes/                   # NotesCanvas, HandwrittenNote, PaperBackground, DownloadButton
├── lib/
│   ├── storage.ts               # IndexedDB wrapper (Storage Layer)
│   ├── types.ts                 # Board, Highlight, shared types
│   ├── placement.ts             # next-free-spot logic
│   ├── pdf-validate.ts          # PDF-only check
│   └── export-pdf.ts            # PDF Export
├── public/                      # sample PDF for the demo
├── devpost/                     # Devpost learning workspace
├── package.json
└── README.md
```

## External Services and Dependencies
No external services, API keys, or accounts. Only npm libraries (above) and Google Fonts bundled at build time through `next/font`. Hosting on Vercel is free-tier friendly; no database or functions are used.

## Important Failure Modes
- **Non-PDF upload** → rejected before anything is stored, with a message.
- **PDF with no selectable text (scanned)** → banner explains text highlighting won't work; diagram tool still works.
- **Browser storage unavailable or full** → a clear message that notes can't be saved; the board still works in-session.
- **Excalidraw can't use custom fonts** → use the image-based Handwritten Note Element fallback.

## What Was Simplified and Why
- **Browser storage** instead of accounts and a database — nothing to host; fuller version needs login, a backend database, and file storage.
- **Next-free-spot = below everything** instead of smart packing — predictable and easy to test.
- **Dashboard at `/dashboard`, landing page last** — as the learner asked.
- **Download as one flowing canvas sliced into pages** instead of structured page layout.

## Parallel Work Streams (for `5-build`)
The learner wants to practice running multiple agents. After a short serial foundation (scaffold, `types.ts`, `storage.ts`), these can be built in parallel because each depends only on the shared types and storage API:
1. **Dashboard** (cards, create/rename/delete).
2. **PDF Viewer + Selection Popout + Diagram Select.**
3. **Notes Canvas + Handwritten Note + Placement + Paper.**
4. **PDF Export.**
Integration (wiring Export-to-board and Import-to-notes across panes, Board Workspace Shell, autosave) is done afterwards, serially.

## Decisions and Open Issues
**Learner choices:** Next.js + TypeScript + Tailwind; pdf.js; Excalidraw for notes; IndexedDB local storage with no accounts; PDF download; Vercel deployment with the learner creating and pushing the GitHub repo.
**Derived implementation details (not learner decisions):** react-resizable-panels, idb, jsPDF, the specific handwriting fonts, the placement rule, the data model, the image-based fallback.
**Learner uncertainty:** none stated (the question was left unanswered). The risk the agent raised, whether Excalidraw can use custom handwriting fonts, is the open technical question; early investigation in the build: install Excalidraw, try a text element with a custom font family, and keep native text if it works, else use the fallback above.
**Open:**
- Library versions and compatibility are unverified.
- Whether lined paper can track Excalidraw pan and zoom cleanly.
- Dashboard card extras (thumbnail, page count) — optional.
- Exact set of Excalidraw tools exposed — default to its full toolbar.
- Pane close controls — default to a button on each pane header.
