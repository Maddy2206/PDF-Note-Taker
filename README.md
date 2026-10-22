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

1. On the dashboard, click **Create board**, name it and upload one or more PDFs (a board can hold all the lectures and readings for a topic). Non-PDF files are rejected. Switch between a board's PDFs with the tabs above the PDF; **+ Add PDF** adds more, double-click a tab to rename it.
2. Drag the divider between the PDF and the notes. Use the **PDF** and **Notes** buttons at the top to close or reopen a pane. Zoom the PDF with the **-** / **+** / **Fit width** controls.
3. Select text in the PDF, pick a color and handwriting font, and click **Export to board**. Click a handwritten note to move, resize, delete or **Edit handwritten note**.
4. Click **Clip diagram**, drag a dotted box around a figure, then **Import to notes**.
5. Draw and write with the Excalidraw tools. **Ctrl+Z** undoes, **Ctrl+Shift+Z** redoes. Switch the paper between **Lined** and **Blank**.
6. Reload: the notes, highlights, layout and reading position come back. **Download PDF** saves your notes.
7. On the dashboard, rename or delete a board from its card.

Boards live in the browser you created them in, so a deployed copy starts empty for each visitor.

## Deploy

Push to GitHub and import the repo in Vercel; the Next.js defaults work with no environment variables.

## Built with

Next.js, TypeScript, Tailwind CSS, [pdf.js](https://mozilla.github.io/pdf.js/), [Excalidraw](https://docs.excalidraw.com/), [idb](https://github.com/jakearchibald/idb), [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) and [jsPDF](https://github.com/parallax/jsPDF).
