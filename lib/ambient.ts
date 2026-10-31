/**
 * Focus sounds, generated live with the Web Audio API (no audio files).
 * One shared engine: at most one sound plays at a time, and switching crossfades.
 * Browsers only allow audio after a user gesture, so call `ambient.unlock()` from a click handler.
 */

export type SoundId = "off" | "rain" | "brown" | "pink" | "theta" | "alpha" | "beta";

export const SOUNDS: { id: SoundId; label: string; description: string }[] = [
  { id: "off", label: "Off", description: "No background sound." },
  { id: "rain", label: "Rain", description: "Steady rainfall with soft drops." },
  { id: "brown", label: "Brown noise", description: "A deep rumble that masks voices and traffic." },
  { id: "pink", label: "Pink noise", description: "A softer, balanced hiss, like distant wind or waves." },
  { id: "theta", label: "Theta beats", description: "6 Hz binaural beat for calm, creative work. Use headphones." },
  { id: "alpha", label: "Alpha beats", description: "10 Hz binaural beat for relaxed focus. Use headphones." },
  { id: "beta", label: "Beta beats", description: "18 Hz binaural beat for alert, active study. Use headphones." },
];

export interface SoundPrefs {
  sound: SoundId;
  volume: number;
}

const KEY = "pdfnote.focusSound";
const DEFAULT_PREFS: SoundPrefs = { sound: "off", volume: 0.6 };

/** The remembered choice (validated); falls back to "off" when nothing valid is stored. */
export function loadSoundPrefs(): SoundPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && SOUNDS.some((s) => s.id === v.sound) && typeof v.volume === "number") {
      return { sound: v.sound, volume: Math.min(1, Math.max(0, v.volume)) };
    }
  } catch {}
  return DEFAULT_PREFS;
}

export function saveSoundPrefs(p: SoundPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

type NoiseKind = "white" | "pink" | "brown";

interface Voice {
  id: SoundId;
  gain: GainNode;
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: Voice | null = null;
let volume = DEFAULT_PREFS.volume;
const buffers: Partial<Record<NoiseKind, AudioBuffer>> = {};

const FADE = 0.8;
const BUFFER_SECONDS = 10;

/** Perceptual volume curve so the slider feels even. */
const level = (v: number) => Math.min(1, Math.max(0, v)) ** 2 * 0.8;

function ensure(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = level(volume);
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** A looping noise buffer; the end is crossfaded into the start so the loop has no click. */
function noise(c: AudioContext, kind: NoiseKind): AudioBuffer {
  const cached = buffers[kind];
  if (cached) return cached;
  const rate = c.sampleRate;
  const n = Math.floor(rate * BUFFER_SECONDS);
  const fade = Math.floor(rate * 0.5);
  const raw = new Float32Array(n + fade);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") {
      raw[i] = w * 0.5;
    } else if (kind === "pink") {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      raw[i] = last * 3.5;
    }
  }
  const buf = c.createBuffer(1, n, rate);
  const out = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    out[i] = i < fade ? raw[i] * (i / fade) + raw[n + i] * (1 - i / fade) : raw[i];
  }
  buffers[kind] = buf;
  return buf;
}

function loopSource(c: AudioContext, kind: NoiseKind) {
  const src = c.createBufferSource();
  src.buffer = noise(c, kind);
  src.loop = true;
  src.start(0, Math.random() * BUFFER_SECONDS);
  return src;
}

function filter(c: AudioContext, type: BiquadFilterType, freq: number, q = 0.7) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Each builder wires its nodes into `out` and returns a function that stops them. */
type Builder = (c: AudioContext, out: AudioNode) => () => void;

const rain: Builder = (c, out) => {
  const src = loopSource(c, "pink");
  const body = c.createGain();
  body.gain.value = 0.9;
  src.connect(filter(c, "highpass", 350)).connect(filter(c, "lowpass", 7500)).connect(body).connect(out);
  // A slow swell so the rain breathes a little.
  const lfo = c.createOscillator();
  const depth = c.createGain();
  lfo.frequency.value = 0.13;
  depth.gain.value = 0.12;
  lfo.connect(depth).connect(body.gain);
  lfo.start();
  // Sparse short drops on top of the steady wash.
  const timer = setInterval(() => {
    if (Math.random() > 0.35 || c.state !== "running") return;
    const t = c.currentTime;
    const drop = c.createBufferSource();
    drop.buffer = noise(c, "white");
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    drop.connect(filter(c, "bandpass", 1500 + Math.random() * 3500, 2)).connect(env).connect(out);
    drop.start(t, Math.random() * (BUFFER_SECONDS - 1));
    drop.stop(t + 0.08);
  }, 90);
  return () => {
    clearInterval(timer);
    src.stop();
    lfo.stop();
  };
};

const brown: Builder = (c, out) => {
  const src = loopSource(c, "brown");
  const g = c.createGain();
  g.gain.value = 0.9;
  src.connect(filter(c, "lowpass", 700)).connect(g).connect(out);
  return () => src.stop();
};

const pink: Builder = (c, out) => {
  const src = loopSource(c, "pink");
  const g = c.createGain();
  g.gain.value = 0.8;
  src.connect(filter(c, "lowpass", 4000)).connect(g).connect(out);
  return () => src.stop();
};

/** Two sine tones a few Hz apart, one per ear; the brain perceives the difference as a slow beat. */
const beats =
  (hz: number): Builder =>
  (c, out) => {
    const base = 200;
    const oscs = [base, base + hz].map((freq, i) => {
      const o = c.createOscillator();
      const pan = c.createStereoPanner();
      const g = c.createGain();
      o.frequency.value = freq;
      pan.pan.value = i === 0 ? -1 : 1;
      g.gain.value = 0.22;
      o.connect(g).connect(pan).connect(out);
      o.start();
      return o;
    });
    return () => oscs.forEach((o) => o.stop());
  };

const BUILDERS: Record<Exclude<SoundId, "off">, Builder> = {
  rain,
  brown,
  pink,
  theta: beats(6),
  alpha: beats(10),
  beta: beats(18),
};

function fadeVoice(v: Voice, seconds: number) {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime;
  v.gain.gain.cancelScheduledValues(t);
  v.gain.gain.setValueAtTime(v.gain.gain.value, t);
  v.gain.gain.linearRampToValueAtTime(0, t + seconds);
  setTimeout(() => {
    try {
      v.stop();
      v.gain.disconnect();
    } catch {}
  }, seconds * 1000 + 100);
}

export const ambient = {
  /** Create/resume the audio engine. Call from a click handler. */
  unlock() {
    ensure();
  },

  /** Start a sound (crossfading from any current one). Does nothing if it is already playing. */
  play(id: SoundId) {
    if (id === "off") return this.fadeOut();
    if (current?.id === id) return;
    const c = ensure();
    if (!c || !master) return;
    if (current) fadeVoice(current, FADE);
    const gain = c.createGain();
    const t = c.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + FADE);
    gain.connect(master);
    const stop = BUILDERS[id](c, gain);
    current = { id, gain, stop };
  },

  /** Fade the current sound out and stop it. */
  fadeOut(seconds = 1.2) {
    if (!current) return;
    fadeVoice(current, seconds);
    current = null;
  },

  /** Volume from 0 to 1. */
  setVolume(v: number) {
    volume = v;
    if (ctx && master) master.gain.setTargetAtTime(level(v), ctx.currentTime, 0.05);
  },
};
