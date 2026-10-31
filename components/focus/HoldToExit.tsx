"use client";

import { useEffect, useRef, useState } from "react";

/** Must be held for a few seconds, so ending a session early is a deliberate choice. */
export default function HoldToExit({
  onComplete,
  label = "Hold to end session",
  seconds = 3,
}: {
  onComplete: () => void;
  label?: string;
  seconds?: number;
}) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number>(0);
  const startedAt = useRef<number | null>(null);
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  function stop() {
    startedAt.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  }
  function begin() {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    const step = (t: number) => {
      if (startedAt.current === null) return;
      const p = Math.min(1, (t - startedAt.current) / (seconds * 1000));
      setProgress(p);
      if (p >= 1) {
        stop();
        done.current();
      } else raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      type="button"
      className="btn btn-secondary relative select-none overflow-hidden"
      aria-label={`${label} (hold for ${seconds} seconds)`}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onBlur={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-[var(--color-accent)] opacity-30"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative">{progress > 0 ? "Keep holding…" : label}</span>
    </button>
  );
}
