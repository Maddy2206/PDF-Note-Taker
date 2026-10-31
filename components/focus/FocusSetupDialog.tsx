"use client";

import { useState } from "react";
import type { FocusSession, PdfDoc } from "@/lib/types";
import { FOCUS_LIMITS, FOCUS_PRESETS, clamp } from "@/lib/focus";

type Opts = Pick<FocusSession, "focusMinutes" | "breakMinutes" | "rounds" | "goal" | "target">;

interface Saved {
  preset: string;
  focusMinutes: number;
  breakMinutes: number;
  rounds: number;
}

const KEY = "pdfnote.focus";

function loadSaved(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && typeof v.preset === "string") {
      return {
        preset: v.preset,
        focusMinutes: clamp(v.focusMinutes, FOCUS_LIMITS.focusMinutes),
        breakMinutes: clamp(v.breakMinutes, FOCUS_LIMITS.breakMinutes),
        rounds: clamp(v.rounds, FOCUS_LIMITS.rounds),
      };
    }
  } catch {}
  const p = FOCUS_PRESETS[0];
  return { preset: p.id, focusMinutes: p.focusMinutes, breakMinutes: p.breakMinutes, rounds: p.rounds };
}

function Num({
  label,
  value,
  limits,
  onChange,
}: {
  label: string;
  value: number;
  limits: readonly [number, number];
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-600">{label}</span>
      <input
        type="number"
        className="input"
        style={{ background: "#fff", color: "#000" }}
        min={limits[0]}
        max={limits[1]}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={() => onChange(clamp(value, limits))}
      />
    </label>
  );
}

export default function FocusSetupDialog({
  docs,
  activeDocId,
  onStart,
  onClose,
}: {
  docs: PdfDoc[];
  activeDocId: string;
  onStart: (opts: Opts) => void;
  onClose: () => void;
}) {
  const [saved] = useState(loadSaved);
  const [preset, setPreset] = useState(saved.preset);
  const [focusMinutes, setFocus] = useState(saved.focusMinutes);
  const [breakMinutes, setBreak] = useState(saved.breakMinutes);
  const [rounds, setRounds] = useState(saved.rounds);
  const [goal, setGoal] = useState("");
  const [useTarget, setUseTarget] = useState(false);
  const [docId, setDocId] = useState(activeDocId);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(10);

  const doc = docs.find((d) => d.id === docId) ?? docs[0];
  const maxPage = doc.pageCount > 0 ? doc.pageCount : 9999;

  function pick(id: string) {
    setPreset(id);
    const p = FOCUS_PRESETS.find((x) => x.id === id);
    if (p) {
      setFocus(p.focusMinutes);
      setBreak(p.breakMinutes);
      setRounds(p.rounds);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = clamp(focusMinutes, FOCUS_LIMITS.focusMinutes);
    const b = clamp(breakMinutes, FOCUS_LIMITS.breakMinutes);
    const r = clamp(rounds, FOCUS_LIMITS.rounds);
    try {
      localStorage.setItem(KEY, JSON.stringify({ preset, focusMinutes: f, breakMinutes: b, rounds: r }));
    } catch {}
    const lo = clamp(Math.min(from, to), [1, maxPage]);
    const hi = clamp(Math.max(from, to), [1, maxPage]);
    onStart({
      focusMinutes: f,
      breakMinutes: b,
      rounds: r,
      goal: goal.trim() || undefined,
      target: useTarget ? { docId: doc.id, fromPage: lo, toPage: hi } : undefined,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Start a focus session"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", color: "#000" }}
        className="max-h-[94vh] w-full max-w-lg space-y-5 overflow-y-auto border border-zinc-300 p-7 shadow-xl"
      >
        <h2 className="text-2xl font-extrabold">Focus session</h2>

        <div>
          <span className="mb-1 block text-sm text-zinc-600">Focus / break × rounds (minutes)</span>
          <div className="seg flex-wrap" role="group" aria-label="Timer preset">
            {FOCUS_PRESETS.map((p) => (
              <button key={p.id} type="button" className="seg-opt" aria-pressed={preset === p.id} onClick={() => pick(p.id)}>
                {p.label}
              </button>
            ))}
            <button type="button" className="seg-opt" aria-pressed={preset === "custom"} onClick={() => setPreset("custom")}>
              Custom
            </button>
          </div>
          {preset === "custom" && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Num label="Focus (min)" value={focusMinutes} limits={FOCUS_LIMITS.focusMinutes} onChange={setFocus} />
              <Num label="Break (min)" value={breakMinutes} limits={FOCUS_LIMITS.breakMinutes} onChange={setBreak} />
              <Num label="Rounds" value={rounds} limits={FOCUS_LIMITS.rounds} onChange={setRounds} />
            </div>
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Goal for this session (optional)</span>
          <input
            className="input"
            style={{ background: "#fff", color: "#000" }}
            maxLength={120}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Finish chapter 3 and summarise it"
          />
        </label>

        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useTarget} onChange={(e) => setUseTarget(e.target.checked)} />
            Set a PDF page target
          </label>
          {useTarget && (
            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-3">
              {docs.length > 1 ? (
                <label className="block">
                  <span className="mb-1 block text-zinc-600">PDF</span>
                  <select
                    className="input"
                    style={{ background: "#fff", color: "#000" }}
                    value={doc.id}
                    onChange={(e) => setDocId(e.target.value)}
                  >
                    {docs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="truncate">{doc.name}</span>
              )}
              <Num label="From page" value={from} limits={[1, maxPage]} onChange={setFrom} />
              <Num label="To page" value={to} limits={[1, maxPage]} onChange={setTo} />
            </div>
          )}
        </div>

        <p className="bg-zinc-100 p-3 text-xs text-zinc-700">
          This opens full screen. A web page can&apos;t silence your computer, so turn on Do Not
          Disturb first. If you leave during a session, your timer keeps running and the summary
          counts it.
        </p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" autoFocus className="btn btn-primary">
            Start focusing
          </button>
        </div>
      </form>
    </div>
  );
}
