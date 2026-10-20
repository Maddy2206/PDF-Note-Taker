---
doc: prd
status: approved
---

# PDF Note taker — Product Requirements

A web app where a student reads a PDF in one pane and builds handwritten-style, editable notes in the other; highlights flow into the notes automatically.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

## The Core Journey
1. The user lands on the **Dashboard**, which shows their boards as cards (empty at first) and a **Create board** button. (The marketing landing page is built last, not part of this PRD's first pass.)
2. They click **Create board**, give it a name, and upload a PDF. Anything that isn't a PDF is rejected.
3. After upload they are taken to the **Board workspace**: the PDF on one side, the notes pane on the other, separated by a draggable divider.
4. They read, and select text in the PDF. A popout appears with highlight color, handwriting font, and an **Export to board** action.
5. Choosing export puts the exact selected words, in the chosen handwritten font, into the notes at the next free spot. The highlight stays on the PDF.
6. For a diagram, they use the **diagram select tool**, draw a dotted boundary around it, and import it. It appears in the notes and can be moved and resized like the handwritten text.
7. They add their own writing and drawing with the notes tools, move/edit/delete items, undo/redo.
8. Their work is saved. Later they return to the Dashboard, click the board's card, and the board opens exactly as they left it (notes, highlights, divider, scroll position) so they can keep reading and noting.
9. They can **download** their notes to read elsewhere.

Success = steps 4-5 work (highlight becomes handwritten note), step 6 works (diagram import), and step 8 works (reopen restores state). (`scope.md > What "Working" Looks Like`)

## Screens and Layout
Two surfaces (landing page deferred):

### Dashboard
- Card grid of boards. Each card shows: board name, last reopened time, and more info ("etc." — see Open Questions).
- Create board button. Each card has rename and delete.
- Clicking a card opens that board's workspace.

### Board workspace
- Split view: PDF viewer and notes pane side by side, separated by a vertical divider that can be dragged left/right.
- Each pane can be closed so the user sees only the PDF or only the notes; it can be reopened. (Exact controls: see Open Questions.)
- Notes pane has a toolbar (below).

## Look and Feel
Established so far: handwritten text is chosen because it is "soothing to the eyes" and easy to read; multiple handwriting fonts; Excalidraw-style hand-drawn feel for the notes tools; notes paper can be lined or blank, chosen by the user.
Overall app styling (dashboard, workspace chrome): the learner has no specific direction and chose to fall back to the default clean AI-app styling. This is a learner decision, made knowing it will look fairly generic. The handwritten fonts and the notes surface above are the distinctive parts.

## Features and Behavior

### Create board and upload
- As a student, I want to create a board and upload my PDF so that I have a place for notes on that book.
  - [ ] Create board asks for a name and a PDF file.
  - [ ] Selecting a non-PDF file is rejected with a clear message; no board is created.
  - [ ] On successful upload I land in that board's workspace with the PDF displayed.

### Dashboard cards
- As a student, I want to see all my boards so that I can resume any of them.
  - [ ] Each board appears as a card with its name and last-reopened time.
  - [ ] Clicking a card opens the workspace in the saved state.
  - [ ] Rename changes the card name; delete removes the board after a confirmation.

### Split workspace
- As a student, I want to resize or hide either pane so that I can focus on reading or on notes.
  - [ ] Dragging the divider resizes both panes smoothly, left and right.
  - [ ] I can close the PDF pane (notes only) or the notes pane (PDF only), and bring it back.

### Highlight to handwritten note (must-keep)
- As a student, I want my highlights to become handwritten notes so that I actually revisit them.
  - [ ] Selecting text in the PDF shows a popout with color choices, font choices, and an Export to board action.
  - [ ] Export adds the exact selected words to the notes, in the chosen handwritten font, at the next free spot.
  - [ ] The chosen color highlights the text on the PDF and stays there.
  - [ ] The note item can be edited, moved, resized(?) and deleted.

### Diagram import
- As a student, I want to clip a diagram from the PDF so that it sits next to my notes.
  - [ ] A diagram select tool lets me draw a dotted boundary around a region of the page.
  - [ ] Confirming imports that region as an image into the notes.
  - [ ] The imported image can be moved and resized like handwritten text.

### Notes tools
- As a student, I want to write and draw my own things in the notes so that notes are not only highlights.
  - [ ] Tools include drawing (pen), colors, and other Excalidraw-like tools; undo and redo; export.
  - [ ] The paper can be set to lined or blank (user's choice).
  - [ ] Everything on the notes surface can be selected, moved and deleted.

### Save, resume, download
- As a student, I want my notes to persist so that I can keep adding as I read more pages.
  - [ ] Closing and reopening a board restores PDF position, highlights, notes, and divider position.
  - [ ] A download button saves the notes as a PDF file that shows the handwritten text, imported diagrams, and drawings as seen on the notes surface.

## States and Boundaries
- **First use / empty Dashboard** — no cards; a prompt to create the first board. (Assumption: wording is mine.)
- **Wrong file type** — upload is rejected automatically; user sees a message.
- **Empty notes** — blank (or lined) paper with the tools visible.
- **Persistence** — boards, PDFs, highlights, and notes persist between sessions. Whether this is per browser/device or per account is an Open Question (spec-level; no accounts assumed).
- **Scanned PDF with no selectable text** — assumption: text highlight can't work; the user sees a message. Diagram select still works. (Confirm.)

## Product Decisions
- Name: "PDF Note taker" — learner's choice, "for now".
- Build the functional app first, landing page last — "for simplicity".
- Boards model: create a board by uploading a PDF; Dashboard of cards — learner's design.
- Highlight popout includes color + font + export; text lands at the next free spot — learner's design.
- Notes use the exact highlighted words, no AI rewriting — learner's choice (`scope.md`).
- Diagram import uses a select tool with a dotted boundary; imported items resize/move like text — learner's design.
- All scoped items stay "now"; time is not a constraint — learner's instruction.
- Paper lined or blank is left to the user — learner's choice.
- App styling: default AI-app look, no specific direction — learner's choice.
- Download format: PDF — learner's choice.
- PDF-only upload, other files auto-rejected — learner's choice.
- Rename and delete boards allowed — learner's choice.

## What We're Building
Dashboard with board cards (create, rename, delete, reopen in saved state); PDF-only upload; split workspace with draggable divider and closable panes; text selection popout (color, font, export); handwritten notes at next free spot; diagram select-and-import; full notes tools (pen, colors, shapes etc., undo/redo, export); lined/blank paper; multiple handwriting fonts; persistent state; download of notes.

## Deferred From the POC
- Marketing landing page — built last per the learner.
- Accounts, login, sharing, multi-user — not mentioned; implied only if "saved boards" must follow the user across devices.
- AI summarizing of highlights — cut in scope.

## Possible Later Enhancements
Search across notes; jump from a note back to its PDF page; mobile layout.

## Non-Goals
- No AI rewriting of highlighted text.
- No support for non-PDF files.
- No collaboration.

## Open Questions
- Dashboard card "etc.": any info beyond name and last reopened (e.g. PDF title, page count, a thumbnail)? — can wait.
- Which exact notes tools make the "everything" list (pen, shapes, arrows, typed text, eraser)? — can wait; defaults to Excalidraw-like set.
- Scanned PDFs / no-text PDFs behavior — confirm assumption above.
- Closing panes: separate close buttons per pane, or a toggle? — can wait.
