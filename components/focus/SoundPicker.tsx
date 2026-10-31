"use client";

import { SOUNDS, type SoundId } from "@/lib/ambient";

/** Sound choices plus a volume slider. Shared by the setup dialog and the in-session menu. */
export default function SoundPicker({
  sound,
  volume,
  onSound,
  onVolume,
}: {
  sound: SoundId;
  volume: number;
  onSound: (s: SoundId) => void;
  onVolume: (v: number) => void;
}) {
  const current = SOUNDS.find((s) => s.id === sound);
  return (
    <div className="space-y-3 text-sm">
      <div className="seg flex-wrap" role="group" aria-label="Focus sound">
        {SOUNDS.map((s) => (
          <button key={s.id} type="button" className="seg-opt" aria-pressed={sound === s.id} onClick={() => onSound(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {current && <p className="text-xs text-zinc-600">{current.description}</p>}
      <label className="flex items-center gap-3">
        <span className="text-zinc-600">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label="Volume"
          className="flex-1"
        />
      </label>
    </div>
  );
}
