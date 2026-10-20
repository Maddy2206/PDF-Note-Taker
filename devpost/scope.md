---
doc: scope
status: approved
---

# PDF Notes (working title)

A side-by-side PDF reader and editable notes pane where highlighted text automatically becomes handwritten-style notes.

## The Unique Kernel
Highlighting in the PDF *is* note-taking. Whatever you highlight or select lands in the notes pane automatically, as your exact words in a handwritten font, so highlights stop being a pile nobody revisits and become notes you actually read.

## Who It's For
The learner themself: a student who studies mostly from PDFs and books. Today, notes are hard to maintain and highlighted text is never looked at again.

## The Core Loop
Open a PDF. It sits on one side, the notes pane on the other. Read some pages and highlight what matters; each highlight appears in the notes as handwritten text. Select a diagram and import it into the notes. Add own writing or drawing in the notes. Close it. Next session, reopen the PDF and the notes are as you left them, ready to continue as you read more pages. Download the notes to read them easily elsewhere.

## Inspiration & Identity
Excalidraw-style editing in the notes pane (hand-drawn feel, free drawing and writing). The handwritten look is deliberate: "soothing to the eyes" and easier to read than typed text. Multiple handwriting fonts to choose from.

## Why This Matters to the Learner
"Mostly I study from PDF and book but it is difficult to maintain the notes and all. Also the highlighted text nobody comes to it later." Also a chance to practice running multiple agents at once and getting the most out of Claude Code.

## What "Working" Looks Like
Open a PDF next to an empty notes pane. Highlight a sentence and see your exact words appear as handwritten text in the notes. Select a diagram in the PDF and import it into the notes. Move and delete items, draw something of your own. Reload and your notes are still there. Download them.
The "oh, that's cool" beat for the demo: highlight, then handwritten text appears; select a diagram, then it lands in the notes.

## The POC Boundary
In (all confirmed "now" by the learner):
- Two panes: PDF viewer and an editable notes pane.
- Highlight/select text in the PDF -> exact words added to notes in a handwritten font (must-keep).
- Notes items are editable: move, delete, etc.
- Select a diagram in the PDF and import it into the notes.
- Free drawing/writing tools in the notes (Excalidraw-like).
- Multiple handwriting fonts.
- Notes saved and restored when the PDF is reopened.
- Download notes.

## Later
Nothing named yet; everything discussed is currently "now". (See open risk below.)

## Explicitly Cut
No AI summarizing or rewriting of highlights; the notes use the exact highlighted words. Anything not mentioned above (accounts, sharing, multi-user, mobile) is out unless raised later.

## Open Risk
The "now" list is large for a 2-4 hour proof of concept. The learner said not to worry about time: everything listed is in. Build order still follows their priority: highlight-to-handwritten notes first (must-keep), then diagram import (in the demo), then the rest. Sequence this in `4-spec` and `5-build`.
