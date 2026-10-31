import type { FocusSession } from "./types";

export interface FocusPreset {
  id: string;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
  rounds: number;
}

export const FOCUS_PRESETS: FocusPreset[] = [
  { id: "classic", label: "25 / 5 × 4", focusMinutes: 25, breakMinutes: 5, rounds: 4 },
  { id: "deep", label: "50 / 10 × 2", focusMinutes: 50, breakMinutes: 10, rounds: 2 },
  { id: "short", label: "15 / 3 × 3", focusMinutes: 15, breakMinutes: 3, rounds: 3 },
];

export const FOCUS_LIMITS = {
  focusMinutes: [1, 120],
  breakMinutes: [1, 30],
  rounds: [1, 8],
} as const;

export const EXTEND_MS = 5 * 60_000;
/** A day counts toward the streak with at least this much focused time. */
export const STREAK_MIN_MS = 10 * 60_000;

export const clamp = (n: number, [lo, hi]: readonly [number, number] | readonly number[]) =>
  Math.min(hi, Math.max(lo, Math.round(n) || lo));

export function newSession(
  boardId: string,
  opts: Pick<FocusSession, "focusMinutes" | "breakMinutes" | "rounds" | "goal" | "target">,
  now: number,
  firstPage?: string,
): FocusSession {
  const focusMinutes = clamp(opts.focusMinutes, FOCUS_LIMITS.focusMinutes);
  return {
    id: crypto.randomUUID(),
    boardId,
    startedAt: now,
    status: "active",
    goal: opts.goal?.trim() || undefined,
    target: opts.target,
    focusMinutes,
    breakMinutes: clamp(opts.breakMinutes, FOCUS_LIMITS.breakMinutes),
    rounds: clamp(opts.rounds, FOCUS_LIMITS.rounds),
    round: 1,
    phase: "focus",
    phaseStartedAt: now,
    phaseEndsAt: now + focusMinutes * 60_000,
    focusedMs: 0,
    awayCount: 0,
    pagesSeen: firstPage ? [firstPage] : [],
    highlightsAdded: 0,
    diagramsAdded: 0,
  };
}

/** The phase's time has run out (the overlay then waits for a click). */
export const phaseOver = (s: FocusSession, now: number) => now >= s.phaseEndsAt;

/** Focus time credited so far, capped at the phase end so a late timer can't over-count. */
export function focusedSoFar(s: FocusSession, now: number): number {
  if (s.phase !== "focus") return s.focusedMs;
  return s.focusedMs + Math.max(0, Math.min(now, s.phaseEndsAt, s.endedAt ?? Infinity) - s.phaseStartedAt);
}

/** Adds 5 minutes. After the round ended, the gap before clicking isn't counted as focus. */
export function extend(s: FocusSession, now: number): FocusSession {
  if (now < s.phaseEndsAt) return { ...s, phaseEndsAt: s.phaseEndsAt + EXTEND_MS };
  return { ...s, focusedMs: focusedSoFar(s, now), phaseStartedAt: now, phaseEndsAt: now + EXTEND_MS };
}

/** Focus round finished: start its break. */
export function startBreak(s: FocusSession, now: number): FocusSession {
  return {
    ...s,
    focusedMs: focusedSoFar(s, now),
    phase: "break",
    phaseStartedAt: now,
    phaseEndsAt: now + s.breakMinutes * 60_000,
  };
}

/** Next focus round (after a break, or skipping it). */
export function nextRound(s: FocusSession, now: number): FocusSession {
  const focused = s.phase === "focus" ? focusedSoFar(s, now) : s.focusedMs;
  return {
    ...s,
    focusedMs: focused,
    round: s.round + 1,
    phase: "focus",
    phaseStartedAt: now,
    phaseEndsAt: now + s.focusMinutes * 60_000,
  };
}

export function finish(s: FocusSession, now: number, early: boolean): FocusSession {
  const end = s.phase === "focus" ? Math.min(now, s.phaseEndsAt) : s.phaseStartedAt;
  return {
    ...s,
    focusedMs: focusedSoFar(s, now),
    status: early ? "ended-early" : "completed",
    endedAt: Math.max(end, s.startedAt),
  };
}

export const pageKey = (docId: string, page: number) => `${docId}:${page}`;

export function withPage(s: FocusSession, docId: string, page: number): FocusSession {
  const k = pageKey(docId, page);
  return s.pagesSeen.includes(k) ? s : { ...s, pagesSeen: [...s.pagesSeen, k] };
}

/** Distinct pages opened inside the target range (or all pages when there is no target). */
export function pagesVisited(s: FocusSession): number {
  const t = s.target;
  if (!t) return s.pagesSeen.length;
  return s.pagesSeen.filter((k) => {
    const i = k.lastIndexOf(":");
    const p = Number(k.slice(i + 1));
    return k.slice(0, i) === t.docId && p >= t.fromPage && p <= t.toPage;
  }).length;
}

export const targetSize = (s: FocusSession) =>
  s.target ? s.target.toPage - s.target.fromPage + 1 : 0;

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatMinutes(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export interface FocusStats {
  todayMs: number;
  weekMs: number;
  streak: number;
  sessions: number;
}

/** Totals for today and the last 7 days, and the current streak of qualifying days. */
export function focusStats(sessions: FocusSession[], now: number): FocusStats {
  const perDay = new Map<string, number>();
  let weekMs = 0;
  const weekStart = now - 6 * 86_400_000;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const weekFrom = new Date(weekStart);
  weekFrom.setHours(0, 0, 0, 0);
  for (const s of sessions) {
    const ms = focusedSoFar(s, s.endedAt ?? now);
    perDay.set(dayKey(s.startedAt), (perDay.get(dayKey(s.startedAt)) ?? 0) + ms);
    if (s.startedAt >= weekFrom.getTime()) weekMs += ms;
  }
  // The streak stays alive until today ends: start from yesterday if today doesn't qualify yet.
  let streak = 0;
  const cursor = new Date(start);
  if ((perDay.get(dayKey(cursor.getTime())) ?? 0) < STREAK_MIN_MS) cursor.setDate(cursor.getDate() - 1);
  while ((perDay.get(dayKey(cursor.getTime())) ?? 0) >= STREAK_MIN_MS) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    todayMs: perDay.get(dayKey(now)) ?? 0,
    weekMs,
    streak,
    sessions: sessions.length,
  };
}
