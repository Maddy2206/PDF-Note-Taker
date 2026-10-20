import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Board, Highlight, SceneRecord } from "./types";

interface NoteTakerDB extends DBSchema {
  boards: { key: string; value: Board };
  pdfs: { key: string; value: { boardId: string; blob: Blob } };
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
    dbPromise = openDB<NoteTakerDB>("pdf-note-taker", 1, {
      upgrade(d) {
        d.createObjectStore("boards", { keyPath: "id" });
        d.createObjectStore("pdfs", { keyPath: "boardId" });
        d.createObjectStore("highlights", { keyPath: "id" }).createIndex(
          "by-board",
          "boardId",
        );
        d.createObjectStore("scenes", { keyPath: "boardId" });
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

export async function createBoard(name: string, file: File): Promise<Board> {
  const now = Date.now();
  const board: Board = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    lastOpenedAt: now,
    pageCount: 0,
    lastPage: 1,
    dividerRatio: 0.5,
    paneVisibility: { pdf: true, notes: true },
    paper: "lined",
  };
  const d = await db();
  const tx = d.transaction(["boards", "pdfs"], "readwrite");
  await tx.objectStore("boards").put(board);
  await tx.objectStore("pdfs").put({ boardId: board.id, blob: file });
  await tx.done;
  return board;
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
    ["boards", "pdfs", "highlights", "scenes"],
    "readwrite",
  );
  await tx.objectStore("boards").delete(id);
  await tx.objectStore("pdfs").delete(id);
  await tx.objectStore("scenes").delete(id);
  const hs = tx.objectStore("highlights");
  for (const key of await hs.index("by-board").getAllKeys(id)) {
    await hs.delete(key);
  }
  await tx.done;
}

export async function getPdf(boardId: string): Promise<Blob | undefined> {
  return (await (await db()).get("pdfs", boardId))?.blob;
}

export async function listHighlights(boardId: string): Promise<Highlight[]> {
  return (await db()).getAllFromIndex("highlights", "by-board", boardId);
}

export async function saveHighlight(h: Highlight): Promise<void> {
  await (await db()).put("highlights", h);
}

export async function deleteHighlight(id: string): Promise<void> {
  await (await db()).delete("highlights", id);
}

export async function loadScene(
  boardId: string,
): Promise<SceneRecord | undefined> {
  return (await db()).get("scenes", boardId);
}

export async function saveScene(scene: SceneRecord): Promise<void> {
  await (await db()).put("scenes", scene);
}
