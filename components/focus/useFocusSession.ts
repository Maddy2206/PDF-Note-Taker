"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusSession } from "@/lib/types";
import {
  closeOtherActiveSessions,
  getActiveFocusSession,
  saveFocusSession,
} from "@/lib/storage";
import * as F from "@/lib/focus";

type StartOpts = Pick<FocusSession, "focusMinutes" | "breakMinutes" | "rounds" | "goal" | "target">;

/** A short, soft two-note chime (no audio file needed). Silent if audio is unavailable. */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((hz, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.28;
      o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {}
}

function enterFullscreen() {
  const el = document.documentElement;
  if (!el.requestFullscreen || document.fullscreenElement) return Promise.resolve(!!document.fullscreenElement);
  return el
    .requestFullscreen()
    .then(() => {
      // Best effort: lets Esc be held instead of instantly leaving (Chromium only).
      (navigator as unknown as { keyboard?: { lock?: (k: string[]) => Promise<void> } }).keyboard
        ?.lock?.(["Escape"])
        .catch(() => {});
      return true;
    })
    .catch(() => false);
}

function leaveFullscreen() {
  try {
    (navigator as unknown as { keyboard?: { unlock?: () => void } }).keyboard?.unlock?.();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch {}
}

/** State and actions for one board's focus session. Everything is saved to IndexedDB as it changes. */
export function useFocusSession(boardId: string) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [summary, setSummary] = useState<FocusSession | null>(null);
  /** The phase's time ran out and the overlay is waiting for a choice. */
  const [overKey, setOverKey] = useState<number | null>(null);
  /** The learner left full screen (or reloaded): show "Back to focus". */
  const [needsReturn, setNeedsReturn] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const ref = useRef<FocusSession | null>(null);
  const wantsFullscreen = useRef(false);

  const commit = useCallback((next: FocusSession | null) => {
    ref.current = next;
    setSession(next);
    if (next) saveFocusSession(next).catch(() => setSaveFailed(true));
  }, []);

  // Pick up a session that was running when the page was closed or reloaded.
  useEffect(() => {
    let cancelled = false;
    getActiveFocusSession(boardId)
      .then(async (s) => {
        if (!s || cancelled || ref.current) return;
        await closeOtherActiveSessions(boardId, s.id);
        const now = Date.now();
        const resumed =
          s.phase === "focus" && !F.phaseOver(s, now) ? { ...s, awayCount: s.awayCount + 1 } : s;
        wantsFullscreen.current = true;
        setNeedsReturn(true);
        commit(resumed);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [boardId, commit]);

  // Notice when the current phase ends (also re-checked when the tab becomes visible again).
  const endsAt = session?.phaseEndsAt;
  const phase = session?.phase;
  const active = session?.status === "active";
  const over = active && endsAt !== undefined && overKey === endsAt;
  useEffect(() => {
    if (!active || endsAt === undefined) return;
    let fired = false;
    const check = () => {
      if (fired || Date.now() < endsAt) return;
      fired = true;
      setOverKey(endsAt);
      chime();
    };
    const t = setTimeout(check, Math.max(0, endsAt - Date.now()));
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active, endsAt, phase]);

  // Count leaving: a hidden tab, a blurred window or lost full screen, still absent after a moment.
  useEffect(() => {
    if (!active) return;
    let absent = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const isAway = () =>
      document.hidden ||
      !document.hasFocus() ||
      (wantsFullscreen.current && !document.fullscreenElement);
    const evaluate = () => {
      const lostFullscreen = wantsFullscreen.current && !document.fullscreenElement;
      if (lostFullscreen) setNeedsReturn(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const away = isAway();
        if (away && !absent) {
          absent = true;
          const s = ref.current;
          if (s && s.phase === "focus" && !F.phaseOver(s, Date.now())) {
            commit({ ...s, awayCount: s.awayCount + 1 });
          }
        } else if (!away) {
          absent = false;
        }
      }, 400);
    };
    document.addEventListener("visibilitychange", evaluate);
    document.addEventListener("fullscreenchange", evaluate);
    window.addEventListener("blur", evaluate);
    window.addEventListener("focus", evaluate);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", evaluate);
      document.removeEventListener("fullscreenchange", evaluate);
      window.removeEventListener("blur", evaluate);
      window.removeEventListener("focus", evaluate);
    };
  }, [active, commit]);

  const start = useCallback(
    async (opts: StartOpts, firstPage?: { docId: string; page: number }) => {
      const now = Date.now();
      const s = F.newSession(boardId, opts, now, firstPage && F.pageKey(firstPage.docId, firstPage.page));
      setSummary(null);
      wantsFullscreen.current = await enterFullscreen();
      setNeedsReturn(false);
      commit(s);
      await closeOtherActiveSessions(boardId, s.id).catch(() => {});
    },
    [boardId, commit],
  );

  const returnToFocus = useCallback(async () => {
    wantsFullscreen.current = await enterFullscreen();
    setNeedsReturn(false);
  }, []);

  const update = useCallback(
    (fn: (s: FocusSession, now: number) => FocusSession) => {
      const s = ref.current;
      if (s && s.status === "active") commit(fn(s, Date.now()));
    },
    [commit],
  );

  const end = useCallback(
    (early: boolean) => {
      const s = ref.current;
      if (!s) return;
      const done = F.finish(s, Date.now(), early);
      wantsFullscreen.current = false;
      leaveFullscreen();
      saveFocusSession(done).catch(() => setSaveFailed(true));
      ref.current = null;
      setSession(null);
      setNeedsReturn(false);
      setSummary(done);
    },
    [],
  );

  return {
    session,
    summary,
    over,
    needsReturn,
    saveFailed,
    start,
    returnToFocus,
    extend: () => update(F.extend),
    startBreak: () => update(F.startBreak),
    nextRound: () => update(F.nextRound),
    end,
    dismissSummary: () => setSummary(null),
    recordPage: (docId: string, page: number) => update((s) => F.withPage(s, docId, page)),
    countHighlight: () => update((s) => ({ ...s, highlightsAdded: s.highlightsAdded + 1 })),
    countDiagram: () => update((s) => ({ ...s, diagramsAdded: s.diagramsAdded + 1 })),
  };
}
