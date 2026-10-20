"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

/** Turns a CSS declaration string into a React style object. */
function css(s: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const key = decl.slice(0, i).trim();
    out[key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return out as CSSProperties;
}

const MUTED = (pct: number) => `color-mix(in srgb,var(--color-text) ${pct}%,transparent)`;
const SERIF = "var(--font-serif)";
const PAPER = "#fbf9f9";
const WRAP = "max-width:1480px;margin:0 auto;padding:0 clamp(16px,4vw,48px)";
const DOTS = (size: number, shade = 400) =>
  `background-color:var(--color-bg);background-image:radial-gradient(circle,var(--color-neutral-${shade}) 1px,transparent 1.2px);background-size:${size}px ${size}px`;

const TOOLS: Record<string, ReactNode> = {
  pointer: <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />,
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
  type: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
  square: <rect width="18" height="18" x="3" y="3" />,
  circle: <circle cx="12" cy="12" r="9" />,
  arrow: <path d="M5 19 19 5M9 5h10v10" />,
  pen: <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />,
};

function ToolRow({ active, style }: { active: string; style: string }) {
  return (
    <div style={css(style)}>
      {Object.entries(TOOLS).map(([name, path]) => (
        <span
          key={name}
          style={css(
            `width:28px;height:28px;display:grid;place-items:center;${
              name === active ? "background:var(--color-text);color:var(--color-bg)" : ""
            }`,
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
            {path}
          </svg>
        </span>
      ))}
    </div>
  );
}

const SERIF_TEXT = { fontFamily: SERIF, fontSize: 11, fill: "currentColor", stroke: "none" } as const;

function Contour() {
  return (
    <svg viewBox="0 0 300 190" width="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="1">
      <g transform="rotate(-18 150 95)">
        <ellipse cx="150" cy="95" rx="132" ry="36" />
        <ellipse cx="150" cy="95" rx="100" ry="27" />
        <ellipse cx="150" cy="95" rx="68" ry="18" />
        <ellipse cx="150" cy="95" rx="36" ry="9.5" />
      </g>
      <polyline points="40,150 66,104 88,132 108,96 124,113 138,94 146,101 150,95" stroke="#ec3013" strokeWidth="1.6" />
      <g fill="#ec3013" stroke="none">
        {[[40, 150], [66, 104], [88, 132], [108, 96], [124, 113], [138, 94], [150, 95]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.4" />
        ))}
      </g>
      <path d="M14 180h276M14 180V8" strokeWidth="0.8" />
      <text x="276" y="176" {...SERIF_TEXT} fontStyle="italic">w₁</text>
      <text x="20" y="16" {...SERIF_TEXT} fontStyle="italic">w₂</text>
    </svg>
  );
}

function BTree() {
  return (
    <svg viewBox="0 0 320 140" width="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="110" y="14" width="100" height="24" />
      <path d="M143 14v24M176 14v24" />
      <text x="121" y="31" {...SERIF_TEXT}>7</text>
      <text x="153" y="31" {...SERIF_TEXT}>17</text>
      <text x="186" y="31" {...SERIF_TEXT}>24</text>
      {[10, 88, 166, 244].map((x) => (
        <rect key={x} x={x} y="104" width="66" height="24" />
      ))}
      <text x="18" y="121" {...SERIF_TEXT}>2  3  5</text>
      <text x="94" y="121" {...SERIF_TEXT}>7  13  14</text>
      <text x="178" y="121" {...SERIF_TEXT}>17  19</text>
      <text x="250" y="121" {...SERIF_TEXT}>24  30  33</text>
      <path d="M112 38 L43 104M143 38 L121 104M176 38 L199 104M208 38 L277 104" strokeWidth="0.9" />
      <path d="M76 116h10M154 116h10M232 116h10" stroke="#ec3013" strokeWidth="1.4" />
    </svg>
  );
}

const SENT = [
  "Walking the page table on every access would double memory traffic.",
  "The translation lookaside buffer caches recent VPN → PFN mappings; a TLB hit completes translation in a cycle or two.",
  "If the page-table entry is marked not present, the MMU raises a page fault.",
  "The OS finds the page on disk, reads it in, and restarts the faulting instruction.",
];
const STEPS = [
  "Reading page 1",
  "Text selected — Add to notebook",
  "Quote placed on the canvas with its page link",
  "Capturing Figure 7.1",
  "Figure on the canvas, annotated",
];
const EASE = "cubic-bezier(.2,.7,.2,1)";

const LIBRARY = [
  { course: "CS 4780 · Machine Learning", docs: [["Lecture 7 — Optimization for Learning", "7 items", "25 min ago"], ["Linear Algebra Review Sheet", "Empty", "4 days ago"]] },
  { course: "CS 4320 · Database Systems", docs: [["Lecture 9 — B+ Tree Indexes", "3 items", "Yesterday"]] },
  { course: "CS 4410 · Operating Systems", docs: [["Virtual Memory and Paging", "5 items", "2 days ago"], ["Problem Set 3 — CPU Scheduling", "Empty", "9 days ago"]] },
];
const COMPARE = [
  ["Getting a quote into notes", "Copy, switch windows, paste, retype the page number", "Select, then Add to notebook"],
  ["Figures and diagrams", "Screenshot, crop, upload", "Draw a box around the figure and import it"],
  ["Finding the source later", "Search the PDF for the phrase", "Pick up on the page you left off"],
  ["Your own sketches", "A third app, or paper", "Pen, shapes and connectors on the same canvas"],
];

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ strokeWidth: 2, marginLeft: "auto" }}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Handles({ offset, size }: { offset: number; size: number }) {
  const base = `position:absolute;width:${size}px;height:${size}px;background:var(--color-bg);border:2px solid var(--color-accent);`;
  return (
    <>
      <span style={css(`${base}left:${-offset}px;top:${-offset}px`)} />
      <span style={css(`${base}right:${-offset}px;top:${-offset}px`)} />
      <span style={css(`${base}left:${-offset}px;bottom:${-offset}px`)} />
      <span style={css(`${base}right:${-offset}px;bottom:${-offset}px`)} />
    </>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span style={css(`font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700)`)}>
      {children}
    </span>
  );
}

function Feature({
  n, title, children, aside, last,
}: {
  n: string; title: string; children: ReactNode; aside: ReactNode; last?: boolean;
}) {
  return (
    <section
      style={css(
        `display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:32px 64px;padding:48px 0${
          last ? " clamp(56px,8vw,96px)" : ";border-bottom:2px solid var(--color-divider)"
        }`,
      )}
    >
      <div style={css("display:flex;flex-direction:column;gap:14px;max-width:46ch")}>
        <span style={css("font-weight:800;font-size:15px;font-variant-numeric:tabular-nums")}>{n}</span>
        <h3 style={css("font-size:28px;margin:0")}>{title}</h3>
        {children}
      </div>
      {aside}
    </section>
  );
}

const body = `margin:0;font-size:16px;line-height:1.6;color:${MUTED(80)}`;
const dot = (c: string) => `width:12px;height:12px;background:${c}`;

export default function Landing() {
  const [phase, setPhase] = useState(0);
  const [picked, setPicked] = useState<number[]>([1]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setPhase(4), 0);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => setPhase((p) => (p + 1) % 6), 1700);
    return () => clearInterval(t);
  }, []);

  const p = Math.min(phase, 4);
  const show = (k: number) => p >= k;
  const toggle = (i: number) =>
    setPicked((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  return (
    <div style={css("font-family:var(--font-sans);color:var(--color-text);background:var(--color-bg)")}>
      <nav className="nav" style={css("position:sticky;top:0;z-index:10;background:var(--color-bg);padding-inline:clamp(16px,4vw,48px)")}>
        <span className="nav-brand" style={css("display:flex;align-items:center;gap:10px")}>
          <span style={css(dot("var(--color-accent)"))} />
          Margin
        </span>
        <a href="#features" className="hidden sm:inline">Features</a>
        <a href="#how" className="hidden sm:inline">How it works</a>
        <Link className="btn btn-primary" href="/dashboard" style={css("color:var(--color-bg);white-space:nowrap")}>
          Open your workspace
        </Link>
      </nav>

      <div style={css(WRAP)}>
        <section style={css("padding:clamp(48px,8vw,104px) 0 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:32px 64px;align-items:end")}>
          <h1 style={css("font-size:clamp(38px,5.2vw,76px);line-height:1.04;letter-spacing:-0.03em;margin:0 0 0 -0.05em;white-space:nowrap")}>
            <span style={{ display: "block" }}>Read the PDF.</span>
            <span style={{ display: "block" }}>Build the notes</span>
            <span style={{ display: "block" }}>right beside it.</span>
          </h1>
          <div style={css("display:flex;flex-direction:column;gap:24px;max-width:52ch")}>
            <p style={css(`font-size:18px;line-height:1.55;margin:0;color:${MUTED(82)}`)}>
              Margin puts your textbook and an editable notebook side by side. Select a passage or clip a figure,
              and it lands on the page in your own handwriting, ready for your arrows, sketches and annotations.
            </p>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
              <Link className="btn btn-primary" href="/dashboard" style={css("color:var(--color-bg);height:44px;padding:0 18px;font-size:15px;justify-content:flex-start;min-width:220px;gap:10px;white-space:nowrap")}>
                Open your workspace
                <Arrow />
              </Link>
              <a className="btn btn-secondary" href="#how" style={css("color:var(--color-text);height:44px;padding:0 18px;font-size:15px;white-space:nowrap")}>
                See how it works
              </a>
            </div>
          </div>
        </section>

        <figure aria-label="Margin study workspace: a PDF on the left, a notebook canvas on the right" style={css("margin:0 0 clamp(64px,9vw,120px);border:2px solid var(--color-text);background:var(--color-bg);box-shadow:var(--shadow-lg)")}>
          <div style={css("display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;border-bottom:2px solid var(--color-divider)")}>
            <span style={css("width:10px;height:10px;background:var(--color-accent);flex:none")} />
            <span style={css("display:flex;flex-direction:column;min-width:0;margin-right:auto")}>
              <span style={css("font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700)")}>Machine Learning</span>
              <span style={css("font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>Lecture 7 — Optimization for Learning</span>
            </span>
            <span style={css("display:flex;border:1px solid var(--color-divider);font-size:12px")}>
              <span style={{ padding: "4px 10px" }}>PDF</span>
              <span style={css("padding:4px 10px;background:var(--color-accent);color:var(--color-bg)")}>Split</span>
              <span style={css("padding:4px 10px;border-left:1px solid var(--color-divider)")}>Notes</span>
            </span>
            <span style={css(`font-size:12px;color:${MUTED(70)};white-space:nowrap`)}>{p === 2 || p === 4 ? "Saving…" : "Saved"}</span>
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))")}>
            <div style={css("background:var(--color-surface);padding:28px clamp(12px,3vw,40px) 0;height:500px;overflow:hidden;border-right:2px solid var(--color-divider);position:relative")}>
              <div style={css(`background:${PAPER};box-shadow:var(--shadow-md);padding:32px 36px;font-family:${SERIF};font-size:14px;line-height:1.6;color:#201e1d;max-width:480px;margin:0 auto;height:560px`)}>
                <div style={css("display:flex;justify-content:space-between;font-family:var(--font-sans);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6766;padding-bottom:8px;border-bottom:1px solid #cfcaca;margin-bottom:18px")}>
                  <span>Lecture 7</span><span>1</span>
                </div>
                <div style={css("font-weight:600;font-size:20px;margin-bottom:10px")}>7.1 Gradient descent</div>
                <p style={css("margin:0 0 12px;position:relative")}>
                  That direction is the negative gradient.{" "}
                  <span style={{ background: show(1) ? "var(--color-accent-200)" : "transparent", boxShadow: show(2) ? "inset 0 -2px 0 var(--color-accent)" : "none", transition: "background .4s, box-shadow .3s" }}>
                    The update rule is wₜ₊₁ = wₜ − η∇L(wₜ), where the step size η is called the learning rate.
                  </span>{" "}
                  Each step uses only first-order information.
                  <span style={{ ...css("position:absolute;left:40px;top:-26px;display:flex;gap:2px;padding:2px;background:var(--color-text);color:var(--color-bg);font-family:var(--font-sans);font-size:11px;font-weight:600;box-shadow:var(--shadow-lg);pointer-events:none;white-space:nowrap"), opacity: p === 1 ? 1 : 0, transform: p === 1 ? "none" : "translateY(4px)", transition: `opacity .2s, transform .2s ${EASE}` }}>
                    <span style={{ padding: "5px 9px" }}>Select</span>
                    <span style={{ padding: "5px 9px", background: "var(--color-accent)" }}>Export to board</span>
                  </span>
                </p>
                <div style={{ padding: 8, margin: "6px 0", outline: p === 3 ? "2px dashed var(--color-accent)" : "1px solid transparent", outlineOffset: 2, background: p === 3 ? "var(--color-accent-100)" : "transparent", transition: "background .2s" }}>
                  <div style={{ color: "#2a2726" }}><Contour /></div>
                  <div style={css("font-size:11.5px;line-height:1.4;color:#3b3837;margin-top:6px")}>Figure 7.1  Gradient descent on an elongated quadratic bowl.</div>
                </div>
              </div>
            </div>
            <div className="dot-grid" style={css(`height:500px;position:relative;overflow:hidden;${DOTS(22)}`)}>
              <ToolRow active="pointer" style="display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--color-divider);background:var(--color-bg)" />
              <div style={css("position:absolute;left:28px;top:70px;font-weight:800;font-size:24px;letter-spacing:-0.02em")}>Gradient descent</div>
              <div style={{ ...css("position:absolute;left:28px;top:116px;width:min(300px, calc(100% - 56px));background:var(--color-neutral-100);border:1px solid var(--color-divider)"), boxShadow: p === 2 ? "0 0 0 6px var(--color-accent-200)" : "var(--shadow-sm)", opacity: show(2) ? 1 : 0, transform: show(2) ? "none" : "translateX(-60px) scale(.96)", transition: `opacity .4s, transform .55s ${EASE}, box-shadow .6s` }}>
                <div style={css("padding:5px 10px;border-bottom:1px solid var(--color-neutral-300);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent-700);font-weight:600")}>Handwritten note</div>
                <div style={css("padding:8px 10px 10px;font-family:cursive;font-size:15px;line-height:1.5")}>
                  The update rule is wₜ₊₁ = wₜ − η∇L(wₜ), where the step size η is called the learning rate.
                </div>
              </div>
              <div style={{ ...css(`position:absolute;right:28px;top:214px;width:min(250px, calc(100% - 56px));background:${PAPER};border:1px solid var(--color-divider);padding:10px;outline-offset:4px;box-shadow:var(--shadow-sm)`), outline: p === 4 ? "2px solid var(--color-accent)" : "2px solid transparent", opacity: show(4) ? 1 : 0, transform: show(4) ? "none" : "translateX(-80px) scale(.94)", transition: `opacity .4s, transform .55s ${EASE}` }}>
                <div style={{ color: "#2a2726" }}><Contour /></div>
                <div style={css("display:flex;justify-content:space-between;font-size:10px;margin-top:6px")}>
                  <span style={{ fontFamily: SERIF, color: "#3b3837" }}>Figure 7.1</span><span style={{ color: MUTED(72) }}>p. 1</span>
                </div>
                <Handles offset={6} size={8} />
              </div>
              <div style={{ ...css("position:absolute;right:28px;top:412px;width:min(250px, calc(100% - 56px))"), opacity: show(4) ? 1 : 0, transition: "opacity .5s .35s" }}>
                <svg width="40" height="22" viewBox="0 0 40 22" fill="none" style={{ display: "block", stroke: "var(--color-accent)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M10 20 C 12 12, 16 6, 22 2" /><path d="M14 3 L22 2 L21 10" />
                </svg>
                <div style={css("font-size:13px;line-height:1.4;color:var(--color-accent-700);margin-top:2px")}>Narrow valley = badly conditioned. That&apos;s why it zig-zags.</div>
              </div>
            </div>
          </div>
          <figcaption style={css(`display:flex;gap:16px;flex-wrap:wrap;justify-content:space-between;margin:0;padding:10px 14px;border-top:2px solid var(--color-divider);font-size:12px;color:${MUTED(72)}`)}>
            <span>{p + 1} / 5 — {STEPS[p]}</span>
            <span>Sample: Machine Learning, Lecture 7</span>
          </figcaption>
        </figure>
      </div>

      <hr className="hr" style={{ margin: 0 }} />

      <div style={css(WRAP)} id="features">
        <div style={css("padding:clamp(48px,7vw,88px) 0 12px;display:flex;flex-direction:column;gap:12px")}>
          <Kicker>What it does</Kicker>
          <h2 style={css("font-size:clamp(30px,3.6vw,46px);margin:0;max-width:20ch;letter-spacing:-0.02em")}>Four moves, one workspace.</h2>
        </div>

        <Feature
          n="01"
          title="Select a passage. It's already in your notes."
          aside={
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));border:2px solid var(--color-divider)")}>
              <div style={css(`background:${PAPER};padding:22px 24px;font-family:${SERIF};font-size:15px;line-height:1.65;color:#201e1d`)}>
                <div style={css("font-family:var(--font-sans);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6766;margin-bottom:10px")}>Study guide 6 · p. 2</div>
                {SENT.map((text, i) => (
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(i);
                      }
                    }}
                    style={{ background: picked.includes(i) ? "var(--color-accent-200)" : "transparent", boxShadow: picked.includes(i) ? "inset 0 -2px 0 var(--color-accent)" : "none", cursor: "pointer", transition: "background .15s" }}
                  >
                    {text}{" "}
                  </span>
                ))}
              </div>
              <div className="dot-grid" style={css(`padding:16px;display:flex;flex-direction:column;gap:10px;${DOTS(20)};min-height:260px`)}>
                <div style={css("display:flex;justify-content:space-between;align-items:baseline")}>
                  <span style={css("font-weight:800;font-size:15px")}>Notebook</span>
                  <span style={css(`font-size:12px;color:${MUTED(70)}`)}>{picked.length} {picked.length === 1 ? "note" : "notes"}</span>
                </div>
                {picked.length === 0 && (
                  <span style={css(`font-size:13px;color:${MUTED(70)};border:1px dashed var(--color-divider);padding:14px;background:var(--color-bg)`)}>Exported notes appear here.</span>
                )}
                {picked.map((i) => (
                  <div key={i} style={css("background:var(--color-neutral-100);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm)")}>
                    <div style={css("padding:4px 10px;border-bottom:1px solid var(--color-neutral-300);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent-700);font-weight:600")}>Handwritten · p. 2</div>
                    <div style={css("padding:8px 10px;font-family:cursive;font-size:14px;line-height:1.45")}>{SENT[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <p style={css(body)}>Select text in the PDF and choose Export to board. The exact words land on your notebook page in the handwriting font and colour you picked, line by line on the ruled paper.</p>
          <p style={css(`margin:0;font-size:13px;color:${MUTED(70)}`)}>Try it: click any sentence in the excerpt.</p>
        </Feature>

        <Feature
          n="02"
          title="Lift a diagram off the page."
          aside={
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));border:2px solid var(--color-divider);background:var(--color-surface)")}>
              <div style={{ padding: 22 }}>
                <div style={css(`background:${PAPER};padding:16px;box-shadow:var(--shadow-sm);font-family:${SERIF}`)}>
                  <div style={css("font-size:10px;font-family:var(--font-sans);letter-spacing:0.06em;text-transform:uppercase;color:#6b6766;margin-bottom:10px")}>Lecture 9 · p. 1</div>
                  <div style={css("outline:2px dashed var(--color-accent);outline-offset:4px;background:var(--color-accent-100);padding:8px;position:relative")}>
                    <div style={{ color: "#2a2726" }}><BTree /></div>
                    <span style={css("position:absolute;top:-6px;right:-6px;background:var(--color-accent);color:#fff;font-family:var(--font-sans);font-size:10px;font-weight:600;padding:2px 6px")}>Import to notes</span>
                  </div>
                  <div style={css("font-size:11px;line-height:1.4;margin-top:10px;color:#3b3837")}>Figure 9.1  A B+ tree of order 2.</div>
                </div>
              </div>
              <div className="dot-grid" style={css(`padding:22px;${DOTS(20)};display:flex;flex-direction:column;gap:10px;justify-content:center;border-left:2px solid var(--color-divider)`)}>
                <div style={css(`background:${PAPER};border:1px solid var(--color-divider);box-shadow:var(--shadow-md);padding:10px`)}>
                  <div style={{ color: "#2a2726" }}><BTree /></div>
                  <div style={css("font-size:10px;margin-top:6px;font-family:" + SERIF)}>Figure 9.1</div>
                </div>
                <div style={css("font-size:13px;color:var(--color-accent-700);border-top:2px solid var(--color-accent);padding-top:6px")}>Leaves are linked, so range scans never climb back to the root.</div>
              </div>
            </div>
          }
        >
          <p style={css(body)}>Choose Clip diagram, draw a dashed box around a figure and import it. It lands in the notebook as an image you can move, resize and circle.</p>
        </Feature>

        <Feature
          n="03"
          title="A canvas that edits like a whiteboard."
          aside={
            <div style={css("border:2px solid var(--color-divider);display:flex;flex-direction:column;align-self:start")}>
              <ToolRow active="arrow" style="display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--color-divider)" />
              <div className="dot-grid" style={css(`position:relative;overflow:hidden;aspect-ratio:460 / 290;${DOTS(20)}`)}>
                <div style={css("position:absolute;left:5%;top:7%;font-weight:800;font-size:clamp(14px,2vw,20px)")}>Page faults</div>
                <div style={css("position:absolute;left:5%;top:23%;width:39%;padding:2%;border:2px solid var(--color-text);font-size:clamp(10px,1.4vw,13px);line-height:1.4")}>PTE not present → MMU traps to the OS</div>
                <div style={css("position:absolute;left:55%;top:20%;width:37%;padding:2%;font-size:clamp(10px,1.4vw,13px);line-height:1.4;outline:2px solid var(--color-accent);outline-offset:4px")}>Find page on disk, evict a frame if full, read in, retry instruction</div>
                <svg viewBox="0 0 460 290" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M210 96 L240 90" style={{ stroke: "var(--color-text)", strokeWidth: 2 }} />
                  <path d="M231 85 L240 90 L232 97" style={{ stroke: "var(--color-text)", strokeWidth: 2 }} />
                  <ellipse cx="120" cy="214" rx="86" ry="34" style={{ stroke: "var(--color-text)", strokeWidth: 2 }} />
                  <path d="M318 160 C 300 200, 250 214, 214 212" style={{ stroke: "var(--color-accent)", strokeWidth: 2 }} />
                  <path d="M60 254 C 90 262, 140 260, 182 250" style={{ stroke: "var(--color-accent)", strokeWidth: 2.4 }} />
                </svg>
                <div style={css("position:absolute;left:13%;top:70%;font-size:clamp(10px,1.4vw,13px);font-weight:600")}>2²⁰ PTEs @ 4 KB</div>
              </div>
            </div>
          }
        >
          <p style={css(body)}>Draw with pens and shapes, type, erase, change colours and zoom. Everything resizes, everything undoes. Your handwritten notes are objects too, so you can move or delete them.</p>
          <ul style={css("margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--color-divider);font-size:13px")}>
            {["Handwritten fonts", "Freehand pen", "Shapes and arrows", "Lined or blank pages", "Resize and arrange", "Undo, zoom, pan"].map((t) => (
              <li key={t} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>{t}</li>
            ))}
          </ul>
        </Feature>

        <Feature
          last
          n="04"
          title="Every PDF keeps its notebook."
          aside={
            <div style={css("border:2px solid var(--color-divider)")}>
              <div style={css(`display:grid;grid-template-columns:minmax(0,1fr) 90px 90px;gap:12px;padding:10px 14px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED(65)};border-bottom:2px solid var(--color-divider)`)}>
                <span>Board</span><span>Notebook</span><span>Opened</span>
              </div>
              {LIBRARY.map((g) => (
                <Fragment key={g.course}>
                  <div style={css("padding:10px 14px 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent-700);background:var(--color-surface)")}>{g.course}</div>
                  {g.docs.map(([title, notes, opened]) => (
                    <div key={title} style={css("display:grid;grid-template-columns:minmax(0,1fr) 90px 90px;gap:12px;padding:10px 14px;border-bottom:1px solid var(--color-divider);font-size:14px")}>
                      <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{title}</span>
                      <span style={{ fontSize: 13 }}>{notes}</span>
                      <span style={css(`font-size:13px;color:${MUTED(70)}`)}>{opened}</span>
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          }
        >
          <p style={css(body)}>Boards and their notes travel together and live in your browser. Pick up exactly where you stopped, rename or delete boards, and download the notebook as a PDF whenever you like.</p>
        </Feature>
      </div>

      <hr className="hr" style={{ margin: 0 }} />

      <section id="how" style={css("max-width:1480px;margin:0 auto;padding:clamp(48px,7vw,88px) clamp(16px,4vw,48px)")}>
        <div style={css("display:flex;flex-direction:column;gap:12px;margin-bottom:36px")}>
          <Kicker>How it works</Kicker>
          <h2 style={css("font-size:clamp(30px,3.6vw,46px);margin:0;letter-spacing:-0.02em")}>Three steps per chapter.</h2>
        </div>
        <ol style={css("list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));border-top:2px solid var(--color-text)")}>
          {[
            ["1", "Open a PDF", "Create a board and upload a textbook chapter, lecture notes or a study guide."],
            ["2", "Capture text and figures", "Select a passage and export it, or clip a diagram from the page."],
            ["3", "Organize, annotate, expand", "Arrange what you captured, draw arrows and add your own explanations."],
          ].map(([n, title, text], idx) => (
            <li key={n} style={css(`padding:24px ${idx < 2 ? "24px" : "0"} 28px ${idx === 0 ? "0" : "24px"};display:flex;flex-direction:column;gap:14px;${idx < 2 ? "border-right:2px solid var(--color-divider)" : ""}`)}>
              <span style={css("font-weight:800;font-size:40px;line-height:1;color:var(--color-accent)")}>{n}</span>
              <h3 style={css("font-size:22px;margin:0")}>{title}</h3>
              <p style={css(`margin:0;font-size:15px;color:${MUTED(78)}`)}>{text}</p>
              <div aria-hidden="true" className="dot-grid" style={css(`margin-top:auto;height:120px;border:1px solid var(--color-divider);${DOTS(14, 300)}`)} />
            </li>
          ))}
        </ol>
      </section>

      <hr className="hr" style={{ margin: 0 }} />

      <section style={css("max-width:1480px;margin:0 auto;padding:clamp(48px,7vw,88px) clamp(16px,4vw,48px)")}>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:32px 64px")}>
          <div style={css("display:flex;flex-direction:column;gap:12px")}>
            <Kicker>Why not two apps</Kicker>
            <h2 style={css("font-size:clamp(28px,3vw,38px);margin:0;letter-spacing:-0.02em;max-width:16ch")}>Fewer windows, less copying, sources that stay attached.</h2>
          </div>
          <div role="table" aria-label="Comparison">
            <div role="row" style={css(`display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr);gap:16px;padding:8px 0;border-bottom:2px solid var(--color-divider);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED(65)}`)}>
              <span /><span>PDF viewer + notes app</span><span style={{ color: "var(--color-accent-700)" }}>Margin</span>
            </div>
            {COMPARE.map(([k, a, b]) => (
              <div key={k} role="row" style={css("display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr);gap:16px;padding:14px 0;border-bottom:1px solid var(--color-divider);font-size:14px;line-height:1.45")}>
                <span style={{ fontWeight: 600 }}>{k}</span><span style={{ color: MUTED(72) }}>{a}</span><span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
        <div style={css("max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,104px) clamp(16px,4vw,48px);display:flex;flex-direction:column;gap:32px;align-items:flex-start")}>
          <h2 style={css("font-size:clamp(36px,5vw,68px);line-height:1.04;margin:0 0 0 -0.04em;letter-spacing:-0.025em")}>
            <span style={{ display: "block" }}>Your next chapter,</span>
            <span style={{ display: "block" }}>one workspace.</span>
          </h2>
          <Link className="btn" href="/dashboard" style={css("color:var(--color-bg);border:2px solid var(--color-bg);height:48px;padding:0 20px;font-size:15px;min-width:240px;justify-content:flex-start;gap:10px;white-space:nowrap")}>
            Open your workspace
            <Arrow />
          </Link>
        </div>
      </section>

      <footer style={css(`max-width:1480px;margin:0 auto;padding:28px clamp(16px,4vw,48px);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;font-size:13px;color:${MUTED(70)}`)}>
        <span style={css("display:flex;align-items:center;gap:8px")}>
          <span style={css("width:8px;height:8px;background:var(--color-accent)")} />
          Margin — a study workspace for PDFs
        </span>
        <span style={css("display:flex;gap:20px")}>
          <a href="#features" style={{ color: "inherit" }}>Features</a>
          <a href="#how" style={{ color: "inherit" }}>How it works</a>
          <Link href="/dashboard" style={{ color: "inherit" }}>Workspace</Link>
        </span>
      </footer>
    </div>
  );
}
