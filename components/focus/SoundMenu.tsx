"use client";

import { useRef, useState } from "react";
import { useDismiss } from "@/components/ui/useDismiss";
import SoundPicker from "./SoundPicker";
import type { AmbientControls } from "./useAmbientSound";

/** Speaker button in the focus bar: change the sound, set the volume, or mute it for now. */
export default function SoundMenu({ audio }: { audio: AmbientControls }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(open, root, () => setOpen(false));
  const silent = audio.muted || audio.sound === "off";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={silent ? "Focus sound (off)" : "Focus sound (playing)"}
        title="Focus sound"
        className="btn btn-icon"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          {silent ? (
            <path d="m16 9 5 6m0-6-5 6" />
          ) : (
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          )}
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Focus sound"
          className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-1rem)] space-y-3 border border-[var(--color-divider)] bg-white p-3 text-black shadow-[var(--shadow-md)]"
        >
          <SoundPicker sound={audio.sound} volume={audio.volume} onSound={audio.setSound} onVolume={audio.setVolume} />
          {audio.sound !== "off" && (
            <button type="button" className="btn btn-secondary w-full" onClick={audio.toggleMute}>
              {audio.muted ? "Unmute" : "Mute for now"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
