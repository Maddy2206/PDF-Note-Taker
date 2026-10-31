import type { FocusSession } from "@/lib/types";
import { focusStats, formatMinutes } from "@/lib/focus";

/** Today / this week / streak strip. Hidden until at least one focus session exists. */
export default function FocusStats({ sessions, now }: { sessions: FocusSession[]; now: number }) {
  if (sessions.length === 0) return null;
  const s = focusStats(sessions, now);
  const items: [string, string][] = [
    ["Focused today", formatMinutes(s.todayMs)],
    ["Last 7 days", formatMinutes(s.weekMs)],
    ["Streak", `${s.streak} ${s.streak === 1 ? "day" : "days"}`],
  ];
  return (
    <section aria-label="Focus stats" className="mt-6 grid grid-cols-3 gap-px border-2 border-[var(--color-divider)] bg-[var(--color-divider)]">
      {items.map(([k, v]) => (
        <div key={k} className="bg-[var(--color-bg)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">{k}</div>
          <div className="text-xl font-extrabold tabular-nums">{v}</div>
        </div>
      ))}
    </section>
  );
}
