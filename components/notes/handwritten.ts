import { CaptureUpdateAction, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { renderNoteImage } from "@/lib/note-image";
import { nextFreeSpot } from "@/lib/placement";
import { revealElement } from "./reveal";

export interface NoteMeta {
  kind: "handwritten-note";
  text: string;
  font: string;
  color: string;
}

export function getNoteMeta(el: ExcalidrawElement): NoteMeta | null {
  const d = el.customData as Partial<NoteMeta> | undefined;
  return d?.kind === "handwritten-note" ? (d as NoteMeta) : null;
}

async function addImageFile(api: ExcalidrawImperativeAPI, dataURL: string) {
  const id = crypto.randomUUID() as BinaryFileData["id"];
  api.addFiles([
    { id, dataURL: dataURL as BinaryFileData["dataURL"], mimeType: "image/png", created: Date.now() },
  ]);
  return id;
}

/** Adds the exact text as a handwritten note at the next free spot. */
export async function addHandwrittenNote(
  api: ExcalidrawImperativeAPI,
  meta: Omit<NoteMeta, "kind">,
) {
  const rendered = await renderNoteImage(meta.text, meta.font, meta.color);
  const fileId = await addImageFile(api, rendered.dataURL);
  const existing = api.getSceneElementsIncludingDeleted();
  const { x, y } = nextFreeSpot(existing, rendered.height);
  const [img] = convertToExcalidrawElements([
    {
      type: "image",
      x,
      y,
      width: rendered.width,
      height: rendered.height,
      fileId,
      status: "saved",
    },
  ]);
  const note = { ...img, customData: { kind: "handwritten-note", ...meta } } as ExcalidrawElement;
  api.updateScene({
    elements: [...existing, note] as never,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
  revealElement(api, note);
  return note;
}

/** Re-renders an existing note after its text, font or color changed. */
export async function updateHandwrittenNote(
  api: ExcalidrawImperativeAPI,
  elementId: string,
  meta: Omit<NoteMeta, "kind">,
) {
  const rendered = await renderNoteImage(meta.text, meta.font, meta.color);
  const fileId = await addImageFile(api, rendered.dataURL);
  const elements = api.getSceneElementsIncludingDeleted().map((el) =>
    el.id === elementId
      ? ({
          ...el,
          fileId,
          width: rendered.width,
          height: rendered.height,
          version: el.version + 1,
          versionNonce: Math.floor(Math.random() * 2 ** 31),
          updated: Date.now(),
          customData: { kind: "handwritten-note", ...meta },
        } as ExcalidrawElement)
      : el,
  );
  api.updateScene({
    elements: elements as never,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}
