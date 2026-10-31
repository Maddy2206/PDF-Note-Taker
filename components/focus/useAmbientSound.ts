"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusSession } from "@/lib/types";
import { ambient, loadSoundPrefs, saveSoundPrefs, type SoundId } from "@/lib/ambient";

/**
 * The learner's focus-sound choice, and playback tied to the session: it plays during a focus
 * round and fades out for breaks, the round-over screen, "Back to focus" and when the session ends.
 */
export function useAmbientSound(session: FocusSession | null, over: boolean, needsReturn: boolean) {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  // Mute applies to the current session only.
  const [mutedId, setMutedId] = useState<string | null>(null);
  const muted = !!session && mutedId === session.id;
  const playing = useRef(false);

  const shouldPlay =
    session?.status === "active" && session.phase === "focus" && !over && !needsReturn && !muted && prefs.sound !== "off";
  const sound = prefs.sound;

  useEffect(() => {
    ambient.setVolume(prefs.volume);
  }, [prefs.volume]);

  useEffect(() => {
    if (shouldPlay) {
      ambient.play(sound);
      playing.current = true;
    } else if (playing.current) {
      ambient.fadeOut();
      playing.current = false;
    }
  }, [shouldPlay, sound]);

  useEffect(
    () => () => {
      ambient.fadeOut(0.2);
    },
    [],
  );

  function update(next: { sound: SoundId; volume: number }) {
    setPrefs(next);
    saveSoundPrefs(next);
  }

  return {
    sound: prefs.sound,
    volume: prefs.volume,
    muted,
    setSound: (s: SoundId) => update({ ...prefs, sound: s }),
    setVolume: (v: number) => update({ ...prefs, volume: v }),
    toggleMute: () => setMutedId(muted ? null : (session?.id ?? null)),
  };
}

export type AmbientControls = ReturnType<typeof useAmbientSound>;
