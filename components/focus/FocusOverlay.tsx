"use client";

import type { FocusSession } from "@/lib/types";
import { formatClock, formatMinutes, pagesVisited, targetSize } from "@/lib/focus";
import HoldToExit from "./HoldToExit";
import { useNow } from "./useNow";

function Screen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-bg)] p-6"
    >
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 text-xs uppercase tracking-[0.08em] text-[var(--color-accent-700)]">{children}</div>
);

function Summary({ s, onClose }: { s: FocusSession; onClose: () => void }) {
  const size = targetSize(s);
  const rows: [string, string][] = [
    ["Time focused", formatMinutes(s.focusedMs)],
    ["Rounds", `${s.status === "completed" ? s.round : s.round - (s.phase === "break" ? 0 : 1)} of ${s.rounds} finished`],
    [size > 0 ? "Target pages visited" : "Pages visited", size > 0 ? `${pagesVisited(s)} of ${size}` : String(pagesVisited(s))],
    ["Highlights added", String(s.highlightsAdded)],
    ["Diagrams added", String(s.diagramsAdded)],
    ["Times away", String(s.awayCount)],
  ];
  return (
    <Screen label="Session summary">
      <Eyebrow>{s.status === "completed" ? "Session complete" : "Session ended early"}</Eyebrow>
      <h2 className="m-0 mb-1 text-3xl tracking-tight">
        {s.status === "completed" ? "Nice work." : "Good effort."}
      </h2>
      {s.goal && <p className="mb-4 text-sm">Goal: {s.goal}</p>}
      <dl className="mx-auto my-6 grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-left text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k}</dt>
            <dd className="m-0 font-extrabold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <button autoFocus onClick={onClose} className="btn btn-primary">
        Back to the board
      </button>
    </Screen>
  );
}

/** Everything that covers the board: summary, return prompt, round end and breaks. */
export default function FocusOverlay({
  session,
  summary,
  over,
  needsReturn,
  onReturn,
  onExtend,
  onStartBreak,
  onNextRound,
  onFinish,
  onEnd,
  onCloseSummary,
}: {
  session: FocusSession | null;
  summary: FocusSession | null;
  over: boolean;
  needsReturn: boolean;
  onReturn: () => void;
  onExtend: () => void;
  onStartBreak: () => void;
  onNextRound: () => void;
  onFinish: () => void;
  onEnd: () => void;
  onCloseSummary: () => void;
}) {
  const now = useNow(!!session && (session.phase === "break" || over));
  if (!session) return summary ? <Summary s={summary} onClose={onCloseSummary} /> : null;

  const last = session.round >= session.rounds;

  if (needsReturn) {
    return (
      <Screen label="Back to focus">
        <Eyebrow>Round {session.round}/{session.rounds} · {session.phase === "break" ? "break" : "focus"}</Eyebrow>
        <h2 className="m-0 mb-2 text-3xl tracking-tight">
          {over ? "Time is up" : "Welcome back"}
        </h2>
        <p className="mb-6 text-sm">
          {over
            ? "This phase has ended."
            : `Your timer kept running: ${formatClock(session.phaseEndsAt - now)} left.`}
        </p>
        <button autoFocus onClick={onReturn} className="btn btn-primary">
          Back to focus
        </button>
        <div className="mt-4">
          <HoldToExit onComplete={onEnd} />
        </div>
      </Screen>
    );
  }

  if (session.phase === "break") {
    return (
      <Screen label="Break">
        <Eyebrow>Break · round {session.round}/{session.rounds} done</Eyebrow>
        {over ? (
          <>
            <h2 className="m-0 mb-6 text-3xl tracking-tight">Break over</h2>
            <button autoFocus onClick={onNextRound} className="btn btn-primary">
              Start round {session.round + 1}
            </button>
            <button onClick={onFinish} className="btn btn-secondary ml-2">
              Finish
            </button>
          </>
        ) : (
          <>
            <div role="timer" className="mb-2 text-7xl font-extrabold tabular-nums">
              {formatClock(session.phaseEndsAt - now)}
            </div>
            <p className="mb-6 text-sm">Stand up, stretch, drink some water.</p>
            <button autoFocus onClick={onNextRound} className="btn btn-primary">
              Skip break
            </button>
            <div className="mt-4">
              <HoldToExit onComplete={onEnd} />
            </div>
          </>
        )}
      </Screen>
    );
  }

  if (over) {
    return (
      <Screen label="Round complete">
        <Eyebrow>Round {session.round}/{session.rounds}</Eyebrow>
        <h2 className="m-0 mb-6 text-3xl tracking-tight">{last ? "Session complete" : "Round complete"}</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {!last && (
            <button autoFocus onClick={onStartBreak} className="btn btn-primary">
              Start break
            </button>
          )}
          <button autoFocus={last} onClick={onExtend} className="btn btn-secondary">
            +5 min
          </button>
          <button onClick={onFinish} className={last ? "btn btn-primary" : "btn btn-secondary"}>
            Finish
          </button>
        </div>
      </Screen>
    );
  }
  return null;
}
