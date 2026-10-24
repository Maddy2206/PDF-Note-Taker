import { CaptureUpdateAction, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { BinaryFileData, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { nextFreeSpot } from "@/lib/placement";
import type { NoteSource } from "@/lib/types";
import { fitWidth } from "@/lib/diagram-region";
import { revealElement } from "./reveal";

/** Adds a clipped PDF diagram as a movable, resizable image at the next free spot. */
export function addDiagramImage(
  api: ExcalidrawImperativeAPI,
  img: { dataURL: string; width: number; height: number },
  source?: NoteSource,
) {
  const id = crypto.randomUUID() as BinaryFileData["id"];
  api.addFiles([
    { id, dataURL: img.dataURL as BinaryFileData["dataURL"], mimeType: "image/png", created: Date.now() },
  ]);
  const existing = api.getSceneElementsIncludingDeleted();
  const size = fitWidth(img.width, img.height);
  const { x, y } = nextFreeSpot(existing, size.height);
  const [el] = convertToExcalidrawElements([
    { type: "image", x, y, width: size.width, height: size.height, fileId: id, status: "saved" },
  ]);
  const diagram = { ...el, customData: { kind: "diagram", source } } as ExcalidrawElement;
  api.updateScene({
    elements: [...existing, diagram] as never,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
  revealElement(api, diagram);
  return diagram;
}
