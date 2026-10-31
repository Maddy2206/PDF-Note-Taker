"use client";

import type { ReactNode } from "react";
import type { FocusSession } from "@/lib/types";
import { focusedSoFar, formatClock, pagesVisited, targetSize } from "@/lib/focus";
import HoldToExit from "./HoldToExit";
import { useNow } from "./useNow";

/** The slim bar shown instead of the header during a session. It dims until hovered or focused. */
export default function FocusBar({
  session,
  boardName,
  onEnd,
  children,
}: {
  session: FocusSession;
  boardName: string;
  onEnd: () => void;
  /** Extra controls kept in focus mode (the layout switch). */
  children?: ReactNode;
}) {
  const now = useNow();
  const left = session.phaseEndsAt - now;
  const size = targetSize(session);
  return (
    <header
      aria-label="Focus session"
      className="flex h-12 flex-none items-center gap-3 border-b-2 border-[var(--color-divider)] px-3 opacity-70 transition-opacity focus-within:opacity-100 hover:opacity-100"
    >
      <span className="h-3 w-3 flex-none bg-[var(--color-accent)]" aria-hidden />
      <span className="whitespace-nowrap text-xs uppercase tracking-[0.08em] text-[var(--color-accent-700)]">
        Round {session.round}/{session.rounds}
      </span>
      <span
        role="timer"
        aria-label="Time left in this round"
        className="min-w-[3.5ch] text-xl font-extrabold tabular-nums"
      >
        {formatClock(left)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm" title={session.goal || boardName}>
        {session.goal || boardName}
      </span>
      {size > 0 && (
        <span className="whitespace-nowrap text-xs tabular-nums" title="Distinct target pages opened">
          {pagesVisited(session)}/{size} pages visited
        </span>
      )}
      <span className="hidden whitespace-nowrap text-xs tabular-nums sm:inline">
        {Math.floor(focusedSoFar(session, now) / 60_000)} min focused
      </span>
      {children}
      <HoldToExit onComplete={onEnd} label="Hold to end" />
    </header>
  );
}
