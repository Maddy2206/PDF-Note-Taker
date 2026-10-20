"use client";

import { useEffect, useRef } from "react";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
  type Layout,
} from "react-resizable-panels";
import type { PaneVisibility } from "@/lib/types";

interface Props {
  ratio: number;
  visibility: PaneVisibility;
  onRatioChange: (ratio: number) => void;
  onVisibilityChange: (v: PaneVisibility) => void;
  pdf: React.ReactNode;
  notes: React.ReactNode;
}

/** PDF | draggable divider | notes. Closed panes stay mounted but collapsed. */
export default function SplitLayout({
  ratio,
  visibility,
  onRatioChange,
  onVisibilityChange,
  pdf,
  notes,
}: Props) {
  const pdfRef = usePanelRef();
  const notesRef = usePanelRef();
  const visRef = useRef(visibility);
  useEffect(() => {
    visRef.current = visibility;
  }, [visibility]);

  // Drive the panels from the saved/toggled visibility.
  useEffect(() => {
    const sync = (
      ref: typeof pdfRef,
      shouldShow: boolean,
    ) => {
      const p = ref.current;
      if (!p) return;
      if (shouldShow && p.isCollapsed()) {
        p.expand();
        // A pane that was closed before a reload has no remembered size.
        if (visRef.current.pdf && visRef.current.notes) {
          const share = ref === pdfRef ? ratio : 1 - ratio;
          p.resize(`${share * 100}%`);
        }
      }
      if (!shouldShow && !p.isCollapsed()) p.collapse();
    };
    sync(pdfRef, visibility.pdf);
    sync(notesRef, visibility.notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility, pdfRef, notesRef]);

  // Dragging a pane to zero closes it.
  function reportCollapse(key: keyof PaneVisibility, percent: number) {
    const open = percent > 0;
    if (visRef.current[key] !== open) {
      onVisibilityChange({ ...visRef.current, [key]: open });
    }
  }

  function layoutChanged(layout: Layout) {
    const p = layout.pdf;
    const n = layout.notes;
    if (p > 0 && n > 0) onRatioChange(p / (p + n));
  }

  const pdfStart = visibility.pdf ? (visibility.notes ? ratio * 100 : 100) : 0;
  return (
    <Group
      orientation="horizontal"
      defaultLayout={{ pdf: pdfStart, notes: 100 - pdfStart }}
      onLayoutChanged={layoutChanged}
      className="h-full"
    >
      <Panel
        id="pdf"
        panelRef={pdfRef}
        collapsible
        collapsedSize={0}
        minSize="15%"
        onResize={(s) => reportCollapse("pdf", s.asPercentage)}
      >
        <div className="h-full overflow-hidden">{pdf}</div>
      </Panel>
      <Separator className="w-1.5 bg-zinc-200 transition-colors hover:bg-indigo-400 data-[separator=active]:bg-indigo-500 dark:bg-zinc-700" />
      <Panel
        id="notes"
        panelRef={notesRef}
        collapsible
        collapsedSize={0}
        minSize="15%"
        onResize={(s) => reportCollapse("notes", s.asPercentage)}
      >
        <div className="h-full overflow-hidden">{notes}</div>
      </Panel>
    </Group>
  );
}
