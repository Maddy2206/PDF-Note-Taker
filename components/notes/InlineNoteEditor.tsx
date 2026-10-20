"use client";

import { useEffect, useRef, useState } from "react";
import { getFont, isWhite } from "@/lib/handwriting-fonts";
import { LINE } from "@/lib/pages";
import { MAX_WIDTH, PAD } from "@/lib/note-image";
import type { NoteMeta } from "./handwritten";

/**
 * Edits a handwritten note right on the page: a transparent text box laid over the note
 * in the same font, color and line height, so typing, inserting and deleting look the same
 * as the finished note. Ctrl+Enter or clicking away saves; Escape cancels.
 */
export default function InlineNoteEditor({
  meta,
  x,
  y,
  zoom,
  onCommit,
  onCancel,
}: {
  meta: Omit<NoteMeta, "kind">;
  /** Top-left of the note in the notes pane, in pixels. */
  x: number;
  y: number;
  zoom: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const font = getFont(meta.font);
  const [text, setText] = useState(meta.text);
  const ref = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);

  const fit = (el: HTMLTextAreaElement) => {
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, LINE * zoom)}px`;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    fit(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(save: boolean) {
    if (done.current) return;
    done.current = true;
    if (save) onCommit(text);
    else onCancel();
  }

  return (
    <textarea
      ref={ref}
      value={text}
      aria-label="Edit handwritten note"
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value);
        fit(e.currentTarget);
      }}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") finish(false);
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) finish(true);
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: (MAX_WIDTH + PAD * 2) * zoom,
        padding: `0 0 0 ${PAD * zoom}px`,
        margin: 0,
        border: 0,
        outline: `2px solid var(--color-accent)`,
        outlineOffset: 2,
        resize: "none",
        overflow: "hidden",
        background: "transparent",
        color: meta.color,
        textShadow: isWhite(meta.color) ? "0 0 2px rgba(55,65,81,0.9)" : undefined,
        caretColor: isWhite(meta.color) ? "#374151" : meta.color,
        fontFamily: font.family,
        fontSize: font.size * zoom,
        lineHeight: `${LINE * zoom}px`,
        whiteSpace: "pre-wrap",
        zIndex: 20,
      }}
    />
  );
}
