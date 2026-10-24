import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Board, Highlight, PdfDoc, SceneRecord } from "./types";

interface NoteTakerDB extends DBSchema {
  boards: { key: string; value: Board };
  /** Version 1 only: one PDF per board. Moved into `documents` and `pdfBlobs` in version 2. */
  pdfs: { key: string; value: { boardId: string; blob: Blob } };
  documents: {
    key: string;
    value: PdfDoc;
    indexes: { "by-board": string };
  };
  pdfBlobs: { key: string; value: { docId: string; blob: Blob } };
  highlights: {
    key: string;
    value: Highlight;
    indexes: { "by-board": string };
  };
  scenes: { key: string; value: SceneRecord };
}

let dbPromise: Promise<IDBPDatabase<NoteTakerDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<NoteTakerDB>("pdf-note-taker", 2, {
      async upgrade(d, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          d.createObjectStore("boards", { keyPath: "id" });
          d.createObjectStore("highlights", { keyPath: "id" }).createIndex(
            "by-board",
            "boardId",
          );
          d.createObjectStore("scenes", { keyPath: "boardId" });
        }
        if (oldVersion < 2) {
          d.createObjectStore("documents", { keyPath: "id" }).createIndex("by-board", "boardId");
          d.createObjectStore("pdfBlobs", { keyPath: "docId" });
          if (oldVersion >= 1) {
            // Boards used to hold one PDF: turn it into the board's first document.
            // The document reuses the board's id, so existing highlights just point at it.
            const boards = await tx.objectStore("boards").getAll();
            for (const b of boards) {
              const old = await tx.objectStore("pdfs").get(b.id);
              if (!old) continue;
              await tx.objectStore("pdfBlobs").put({ docId: b.id, blob: old.blob });
              await tx.objectStore("documents").put({
                id: b.id,
                boardId: b.id,
                name: b.name,
                pageCount: b.pageCount ?? 0,
                lastPage: b.lastPage ?? 1,
                zoom: b.pdfZoom ?? null,
                addedAt: b.createdAt,
              });
              await tx.objectStore("boards").put({ ...b, activeDocId: b.id, docCount: 1 });
            }
            const hs = tx.objectStore("highlights");
            for (const h of await hs.getAll()) {
              if (!h.docId) await hs.put({ ...h, docId: h.boardId });
            }
            d.deleteObjectStore("pdfs");
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function listBoards(): Promise<Board[]> {
  const boards = await (await db()).getAll("boards");
  return boards.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export async function getBoard(id: string): Promise<Board | undefined> {
  return (await db()).get("boards", id);
}

function newDoc(boardId: string, file: File, addedAt: number): PdfDoc {
  return {
    id: crypto.randomUUID(),
    boardId,
    name: file.name.replace(/\.pdf$/i, "") || "Untitled",
    pageCount: 0,
    lastPage: 1,
    zoom: null,
    addedAt,
  };
}

export async function createBoard(
  name: string,
  files: File[],
  paper: Board["paper"] = "lined",
  paperColor?: string,
): Promise<Board> {
  const now = Date.now();
  const boardId = crypto.randomUUID();
  const docs = files.map((f, i) => newDoc(boardId, f, now + i));
  const board: Board = {
    id: boardId,
    name,
    createdAt: now,
    lastOpenedAt: now,
    pageCount: 0,
    lastPage: 1,
    dividerRatio: 0.5,
    paneVisibility: { pdf: true, notes: true },
    paper,
    paperColor,
    notePages: 1,
    activeDocId: docs[0]?.id,
    docCount: docs.length,
  };
  const d = await db();
  const tx = d.transaction(["boards", "documents", "pdfBlobs"], "readwrite");
  await tx.objectStore("boards").put(board);
  for (let i = 0; i < docs.length; i++) {
    await tx.objectStore("documents").put(docs[i]);
    await tx.objectStore("pdfBlobs").put({ docId: docs[i].id, blob: files[i] });
  }
  await tx.done;
  return board;
}

/** The board's PDFs in the order they were added. */
export async function listDocs(boardId: string): Promise<PdfDoc[]> {
  const docs = await (await db()).getAllFromIndex("documents", "by-board", boardId);
  return docs.sort((a, b) => a.addedAt - b.addedAt);
}

export async function addDocs(boardId: string, files: File[]): Promise<PdfDoc[]> {
  const now = Date.now();
  const docs = files.map((f, i) => newDoc(boardId, f, now + i));
  const d = await db();
  const tx = d.transaction(["boards", "documents", "pdfBlobs"], "readwrite");
  for (let i = 0; i < docs.length; i++) {
    await tx.objectStore("documents").put(docs[i]);
    await tx.objectStore("pdfBlobs").put({ docId: docs[i].id, blob: files[i] });
  }
  const board = await tx.objectStore("boards").get(boardId);
  if (board) {
    await tx.objectStore("boards").put({ ...board, docCount: (board.docCount ?? 1) + docs.length });
  }
  await tx.done;
  return docs;
}

export async function getDocBlob(docId: string): Promise<Blob | undefined> {
  return (await (await db()).get("pdfBlobs", docId))?.blob;
}

export async function updateDoc(
  docId: string,
  patch: Partial<Omit<PdfDoc, "id" | "boardId">>,
): Promise<void> {
  const d = await db();
  const tx = d.transaction("documents", "readwrite");
  const current = await tx.store.get(docId);
  if (current) await tx.store.put({ ...current, ...patch });
  await tx.done;
}

/** Removes a PDF with its highlights. A board always keeps at least one PDF. */
export async function removeDoc(docId: string): Promise<boolean> {
  const d = await db();
  const tx = d.transaction(["boards", "documents", "pdfBlobs", "highlights"], "readwrite");
  const doc = await tx.objectStore("documents").get(docId);
  if (!doc) return false;
  const siblings = await tx.objectStore("documents").index("by-board").getAllKeys(doc.boardId);
  if (siblings.length <= 1) return false;
  await tx.objectStore("documents").delete(docId);
  await tx.objectStore("pdfBlobs").delete(docId);
  const hs = tx.objectStore("highlights");
  for (const h of await hs.index("by-board").getAll(doc.boardId)) {
    if (h.docId === docId) await hs.delete(h.id);
  }
  const board = await tx.objectStore("boards").get(doc.boardId);
  if (board) {
    const rest = siblings.filter((k) => k !== docId);
    await tx.objectStore("boards").put({
      ...board,
      docCount: rest.length,
      activeDocId: board.activeDocId === docId ? (rest[0] as string) : board.activeDocId,
    });
  }
  await tx.done;
  return true;
}

export async function updateBoard(
  id: string,
  patch: Partial<Omit<Board, "id">>,
): Promise<Board | undefined> {
  const d = await db();
  const tx = d.transaction("boards", "readwrite");
  const current = await tx.store.get(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  await tx.store.put(next);
  await tx.done;
  return next;
}

export async function deleteBoard(id: string): Promise<void> {
  const d = await db();
  const tx = d.transaction(
    ["boards", "documents", "pdfBlobs", "highlights", "scenes"],
    "readwrite",
  );
  await tx.objectStore("boards").delete(id);
  await tx.objectStore("scenes").delete(id);
  for (const key of await tx.objectStore("documents").index("by-board").getAllKeys(id)) {
    await tx.objectStore("documents").delete(key);
    await tx.objectStore("pdfBlobs").delete(key);
  }
  const hs = tx.objectStore("highlights");
  for (const key of await hs.index("by-board").getAllKeys(id)) {
    await hs.delete(key);
  }
  await tx.done;
}

export async function listHighlights(boardId: string): Promise<Highlight[]> {
  return (await db()).getAllFromIndex("highlights", "by-board", boardId);
}

export async function saveHighlight(h: Highlight): Promise<void> {
  await (await db()).put("highlights", h);
}

export async function deleteHighlights(ids: string[]): Promise<void> {
  const tx = (await db()).transaction("highlights", "readwrite");
  await Promise.all([...ids.map((i) => tx.store.delete(i)), tx.done]);
}

export async function loadScene(
  boardId: string,
): Promise<SceneRecord | undefined> {
  return (await db()).get("scenes", boardId);
}

export async function saveScene(scene: SceneRecord): Promise<void> {
  await (await db()).put("scenes", scene);
}
