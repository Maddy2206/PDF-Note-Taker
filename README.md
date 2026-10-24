# PDF Note taker

Read a PDF on one side and build handwritten-style, editable notes on the other. Highlight text in the PDF and it appears in your notes in a handwriting font and the color you picked. Clip diagrams from the PDF into the notes, draw or write your own, and download the notes as a PDF.

Everything is saved in your browser (IndexedDB). There is no server, login or API key.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. A sample PDF is at `public/sample.pdf` (also served at `/sample.pdf`) if you want something to try.

## Try it (the demo flow)

1. On the dashboard, click **Create board**, name it and upload one or more PDFs (a board can hold all the lectures and readings for a topic). Files that are not PDFs (by type/extension and the `%PDF-` header) are rejected. Switch between a board's PDFs with the tabs above the PDF; **+ Add PDF** adds more, double-click a tab to rename it.
2. Drag the divider between the PDF and the notes. Use the **PDF** and **Notes** buttons at the top to close or reopen a pane. Zoom the PDF with the **-** / **+** / **Fit width** controls.
3. Select text in the PDF, pick a color and handwriting font, and click **Export to board**. Click a handwritten note to move, resize or delete it; double-click it to edit the text. Click a highlight on the PDF and choose **Remove highlight** or **Remove note**; they are separate.
4. Click **Clip diagram**, drag a dotted box around a figure, then **Import to notes**.
5. Select any note (text or diagram) and click the **Go to source** chip that appears next to it after a moment (it does not show while you drag, write or edit, and fades after a few seconds). The PDF switches to the right tab, scrolls to the excerpt or figure and flashes it.
6. Draw and write with the Excalidraw tools. **Ctrl+Z** undoes, **Ctrl+Y** redoes. Switch the paper between **Lined**, **Dotted**, **Grid** and **Blank**, with 10 page colors.
7. Reload: the notes, highlights, layout and reading position come back. **Download PDF** saves your notes.
7. On the dashboard, search boards (press `/`), sort them, and rename or delete a board from its card.

Boards live in the browser you created them in, so a deployed copy starts empty for each visitor.

## Limitations

- **No backup or sync.** All data (including the uploaded PDFs) is in the browser's IndexedDB. Clearing site data, private browsing or storage eviction deletes it. Only the notes can be downloaded, as a PDF.
- **No file size or page limit** is enforced; very large PDFs are loaded into memory and may be slow or hit browser storage quota.
- **Scanned PDFs** (no text layer) cannot be highlighted; diagram clipping still works.
- **Exported PDFs are images** of the notes (not selectable or searchable text).
- No mobile layout, accounts or collaboration. Diagrams clipped before the source-link feature have no source to jump to.

## Project structure

```
app/          routes: / (landing), /dashboard, /board/[id] (workspace)
components/   pdf/ (viewer), notes/ (Excalidraw canvas), dashboard/, landing/, ui/, workspace/
lib/          storage.ts (IndexedDB), export-pdf.ts, note-image.ts, paper.ts, placement.ts, ...
public/       sample.pdf
```

See [docs/architecture.md](docs/architecture.md) for components, data flow and the storage schema. Scripts: `npm run dev | build | start | lint` (there are no automated tests).

## Deploy

Push to GitHub and import the repo in Vercel; the Next.js defaults work with no environment variables.

## Built with

Next.js, TypeScript, Tailwind CSS, [pdf.js](https://mozilla.github.io/pdf.js/), [Excalidraw](https://docs.excalidraw.com/), [idb](https://github.com/jakearchibald/idb), [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) and [jsPDF](https://github.com/parallax/jsPDF).
