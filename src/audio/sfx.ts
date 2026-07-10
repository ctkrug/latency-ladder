const MUTE_KEY = "latency-ladder-muted";
const MIN_TICK_GAP_MS = 30;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null;
}

let ctx: AudioContext | null = null;
let lastTickAt = -Infinity;

/** Reads the persisted mute preference; unmuted by default. Access is
 * wrapped because reading localStorage can throw, not just be absent —
 * Safari private mode and some locked-down embeddings reject it outright. */
export function isMuted(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // A write rejection (private mode, quota) shouldn't propagate out of a
    // click handler and break the toggle; the preference just won't persist.
  }
}

/** Creates the AudioContext on first call. Must be invoked from within a
 * user-gesture handler (e.g. a click listener) to satisfy browsers'
 * autoplay policy; safe to call repeatedly. Returns null in environments
 * without WebAudio (older browsers, some test runners). */
function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Call once from a user-gesture handler to unlock audio ahead of time. */
export function primeAudio(): void {
  getContext();
}

/**
 * Plays a short synthesized tick — a quick sine-wave blip with an
 * exponential decay envelope, no audio files involved. `step` shifts the
 * pitch upward per call (0-indexed) so a run of ticks arpeggiates upward,
 * echoing the "climbing the ladder" motion of the bars. No-ops silently
 * when muted, when WebAudio is unavailable, or when called again within
 * MIN_TICK_GAP_MS of the last tick.
 */
export function playTick(step = 0): void {
  if (isMuted()) return;

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastTickAt < MIN_TICK_GAP_MS) return;

  const audioCtx = getContext();
  if (!audioCtx) return;
  lastTickAt = now;

  const baseFrequency = 440;
  const frequency = baseFrequency * Math.pow(1.12, step);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;

  const t0 = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.15);
}
