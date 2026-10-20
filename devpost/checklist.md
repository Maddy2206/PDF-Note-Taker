---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

Execution plan: slices 1-3 run serially. After slice 3, slices 4, 5 and 6 run as three parallel agents in separate git worktrees (learner's choice, to practice multi-agent work), then are merged one at a time with a build check after each merge. Slice 7 follows serially.

## Slices

- [x] **1. You can create a board from a PDF, see it on the dashboard, and read the PDF**
  Becomes usable: A running app. Create a board (name + PDF, non-PDFs rejected), see it as a card on `/dashboard` after reload, click it, and read the PDF on the board page. Everything saved in the browser.
  Why now: Proves the whole path end to end (scaffold, storage, upload, pdf.js worker) and settles the shared types and storage API that later slices, and parallel agents, depend on.
  PRD ref: `prd.md > Create board and upload`, `prd.md > Dashboard cards`, `prd.md > The Core Journey` (steps 1-3)
  Spec ref: `spec.md > Dashboard`, `spec.md > PDF Viewer`, `spec.md > Storage Layer`, `spec.md > Data Model`, `spec.md > File Structure`
  Build: Scaffold Next.js + TypeScript + Tailwind per the file structure; add `lib/types.ts`, `lib/storage.ts` (idb), `lib/pdf-validate.ts`; Dashboard with create dialog and card grid; board page with basic pdf.js page rendering and text layer.
  Verify (mechanical): `npm run build` passes; dev server starts; a non-PDF file is rejected; a PDF creates a board that survives reload and renders in the board page.
  Learner check: Create a board with a real PDF, reload the page, see the card, open it and scroll the PDF.
  Commit: `Scaffold app, storage, dashboard and PDF viewer`

- [x] **2. Split workspace with an Excalidraw notes pane that saves**
  Becomes usable: The board page shows PDF and notes side by side with a draggable divider; either pane can be closed and reopened; you can draw in the notes and it is still there after reload.
  Why now: Gives the highlight kernel somewhere to land, and tests the Excalidraw integration risk (client-only load, CSS) before building on it.
  PRD ref: `prd.md > Split workspace`, `prd.md > Notes tools` (basic), `prd.md > Save, resume, download` (notes persistence)
  Spec ref: `spec.md > Board Workspace Shell`, `spec.md > Notes Canvas`, `spec.md > Data Model`
  Build: Add react-resizable-panels layout with pane close/reopen, dynamic-import Excalidraw, debounced autosave of scene, divider ratio and pane visibility into IndexedDB.
  Verify (mechanical): Build passes; drawing a shape and reloading restores it; divider ratio and a closed pane persist.
  Learner check: Drag the divider, close the PDF pane and the notes pane, draw something, reload and confirm it all comes back.
  Commit: `Add split workspace with persistent Excalidraw notes`

- [x] **3. Highlight text and export it as a handwritten note (the kernel)**
  Becomes usable: Select text in the PDF, a popout offers color, font and Export to board; the exact words appear in the notes in a handwriting font at the next free spot; the highlight stays on the PDF; the note can be edited, moved, resized and deleted.
  Why now: This is `scope.md > The Unique Kernel`. It also carries the biggest technical risk (custom handwriting fonts in Excalidraw), so it comes right after the notes pane exists.
  PRD ref: `prd.md > Highlight to handwritten note`
  Spec ref: `spec.md > Selection Popout`, `spec.md > Handwritten Note Element`, `spec.md > Next-Free-Spot Placement`, `spec.md > Decisions and Open Issues`
  Build: First a small check of whether Excalidraw text elements can use custom fonts; use native text if yes, else the image-based note with `customData` and double-click edit. Add selection popout, highlight rect storage and overlay, `lib/placement.ts`, handwriting fonts via `next/font`.
  Verify (mechanical): Build passes; selecting text and exporting adds a note below existing items; reload restores both note and PDF highlight; a unit-style check of `placement.ts` returns a spot below the lowest element.
  Learner check: Highlight three sentences with different colors and fonts, export each, move and edit one, reload.
  Commit: `Add highlight-to-handwritten-note export`

- [x] **4. Clip a diagram from the PDF into the notes**
  Becomes usable: A diagram tool on the PDF pane; drag a dotted rectangle, import, and the clipped image appears in the notes at the next free spot and moves and resizes like text.
  Why now: Second thing in the demo; independent of the paper and dashboard work.
  PRD ref: `prd.md > Diagram import`
  Spec ref: `spec.md > Diagram Select Tool`, `spec.md > Notes Canvas`
  Build: Add `DiagramSelect` overlay with dotted rectangle, region re-render to PNG at high resolution, add as Excalidraw image element via `addFiles` and `updateScene`.
  Verify (mechanical): Build passes; importing a region adds an image element with the expected aspect ratio; it persists across reload.
  Learner check: Clip a diagram from your PDF, resize and move it in the notes, reload.
  Commit: `Add diagram select and import`

- [x] **5. Paper styles and download notes as PDF**
  Becomes usable: Choose lined or blank paper; a Download button saves the notes as a PDF showing handwriting, diagrams and drawings.
  Why now: Completes the notes side; independent of dashboard polish.
  PRD ref: `prd.md > Notes tools`, `prd.md > Save, resume, download`
  Spec ref: `spec.md > Notes Canvas`, `spec.md > PDF Export`
  Build: Add `PaperBackground` (lines that follow pan and zoom), saved paper style, `lib/export-pdf.ts` with jsPDF, Download button.
  Verify (mechanical): Build passes; downloading yields a non-empty PDF whose page count matches the content height; paper choice persists.
  Learner check: Switch paper style, download the notes and open the PDF to check it reads well.
  Commit: `Add paper styles and PDF download`

- [x] **6. Manage boards and resume exactly where you left**
  Becomes usable: Rename and delete boards (with confirmation); cards show last reopened; reopening restores PDF page position, highlights, notes, and layout.
  Why now: Final round of the dashboard and persistence behavior once everything else exists to restore.
  PRD ref: `prd.md > Dashboard cards`, `prd.md > Save, resume, download`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Dashboard`, `spec.md > Storage Layer`, `spec.md > Data Model`
  Build: Rename/delete on cards, `lastOpenedAt` updates, saved `lastPage` restored, deleting clears all stores, empty-dashboard state.
  Verify (mechanical): Build passes; rename and delete work and remove data from every store; last page restores after reload.
  Learner check: Rename and delete a board, then read to page 10 in another, close it, reopen and confirm it resumes.
  Commit: `Add board rename, delete and resume`

- [x] **7. Failure states and a clean demo run**
  Becomes usable: Scanned (no-text) PDFs show a message while the diagram tool still works; storage errors show a clear message; the README says how to run it; a sample PDF is included for the demo.
  Why now: Last, so it hardens the finished behavior instead of guessing at it.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Banner for text-less PDFs, storage-error message, README with run steps, sample PDF in `public/`.
  Verify (mechanical): `npm run build` passes; a text-less PDF shows the banner; README steps work from a clean install.
  Learner check: Upload a scanned PDF and read the message; follow the README on a clean checkout.
  Commit: `Add failure states, README and sample PDF`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 3 (the kernel), where feedback can still shape slices 4-7
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions
- pdf.js 6.x needs a newer JavaScript feature than the browser used for testing had (`Map.getOrInsertComputed`) — switched the viewer to pdf.js's `legacy` build and worker (`pdfjs-dist/legacy/build/...`); spec's stack row for pdf.js stays the same library, different entry point.
- The scaffold's `cacheComponents` and `partialPrefetching` options were removed from `next.config.ts` — not needed for a client-side app and they add rules about dynamic data; `turbopack.root` set because a stray `package-lock.json` exists in the home folder.
- Excalidraw's text tool only offers its built-in font families (Virgil, Excalifont, Comic Shanns, etc.) and has no custom font registration, so handwritten notes use the spec's fallback: an image rendered in the chosen Google handwriting font (Caveat, Kalam, Patrick Hand, Indie Flower) with the exact text, font and color kept in the element's `customData`. A "Edit handwritten note" button appears when one is selected, instead of double-click, because Excalidraw has no double-click hook.
- next/font's generated "Fallback" font face can fail to load on machines without that system font and rejected `document.fonts.load`, so note rendering now loads only the primary family and treats a failed load as non-fatal.
- Learner feedback after slice 3 (early checkpoint): added PDF zoom (zoom in/out and Fit width, saved per board as `pdfZoom`); notes are now written in the chosen color (palette changed to ink colors: blue, red, green, purple, orange) instead of black text on a colored band; note changes are recorded in Excalidraw's history and Ctrl+Z / Ctrl+Y work even when focus is on the PDF side. Also fixed highlights picking up whole page containers on triple-click selection. The diagram button and lined paper the learner asked for are slices 4 and 5, not yet built.
- Slices 4, 5 and 6 were built by three parallel agents in separate git worktrees. The first launch was lost when the session ended (nothing had been committed), so all three were relaunched from the same commit. They were merged one at a time; slice 6 conflicted with slice 4 in `PdfViewer.tsx` and the board page only by both adding props, resolved by keeping both. The agents could not use the shared browser, so each verified with lint, type-check and logic scripts only.
- The browser testing tool disconnected after slice 3. Slices 4-7 have been verified with lint, `npm run build` and logic scripts (page slicing) but NOT yet clicked through in a real browser; the final kick-the-tires review is where that happens.
