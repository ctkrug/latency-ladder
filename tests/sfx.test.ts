import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeGainParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeGainNode {
  gain = new FakeGainParam();
  connect = vi.fn().mockReturnThis();
}

class FakeOscillatorNode {
  type = "";
  frequency = { value: 0 };
  connect = vi.fn().mockReturnThis();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  currentTime = 0;
  createOscillator = vi.fn(() => new FakeOscillatorNode());
  createGain = vi.fn(() => new FakeGainNode());
  destination = {};
}

// The module caches its AudioContext instance at module scope, so each test
// that cares about context creation gets a fresh module via resetModules.
let sfx: typeof import("../src/audio/sfx");
const originalAudioContext = window.AudioContext;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  sfx = await import("../src/audio/sfx");
});

afterEach(() => {
  window.AudioContext = originalAudioContext;
});

describe("mute persistence", () => {
  it("defaults to unmuted", () => {
    expect(sfx.isMuted()).toBe(false);
  });

  it("persists a mute toggle across reads", () => {
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
    sfx.setMuted(false);
    expect(sfx.isMuted()).toBe(false);
  });

  it("treats a throwing localStorage as unmuted rather than propagating", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(() => sfx.isMuted()).not.toThrow();
    expect(sfx.isMuted()).toBe(false);
    getItem.mockRestore();
  });

  it("swallows a write rejection so the toggle never throws (private mode)", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    expect(() => sfx.setMuted(true)).not.toThrow();
    setItem.mockRestore();
  });
});

describe("primeAudio", () => {
  it("does not throw when AudioContext is unavailable", () => {
    // @ts-expect-error simulating a browser without WebAudio
    delete window.AudioContext;
    expect(() => sfx.primeAudio()).not.toThrow();
  });

  it("eagerly constructs the AudioContext so a later playTick reuses it", () => {
    const ctor = vi.fn(() => new FakeAudioContext());
    // @ts-expect-error test double constructor
    window.AudioContext = ctor;

    sfx.primeAudio();
    expect(ctor).toHaveBeenCalledTimes(1);

    sfx.playTick(0);
    // getContext() short-circuits on the already-primed instance.
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});

describe("playTick", () => {
  it("does not throw when AudioContext is unavailable", () => {
    // @ts-expect-error simulating a browser without WebAudio
    delete window.AudioContext;
    expect(() => sfx.playTick(0)).not.toThrow();
  });

  it("is a silent no-op while muted", () => {
    sfx.setMuted(true);
    const ctor = vi.fn(() => new FakeAudioContext());
    // @ts-expect-error test double constructor
    window.AudioContext = ctor;

    sfx.playTick(0);

    expect(ctor).not.toHaveBeenCalled();
  });

  it("starts and stops a synthesized oscillator when unmuted", () => {
    const created: FakeOscillatorNode[] = [];
    class TrackingAudioContext extends FakeAudioContext {
      override createOscillator = vi.fn(() => {
        const osc = new FakeOscillatorNode();
        created.push(osc);
        return osc;
      });
    }
    // @ts-expect-error test double constructor
    window.AudioContext = TrackingAudioContext;

    sfx.playTick(0);

    expect(created).toHaveLength(1);
    expect(created[0]!.start).toHaveBeenCalledTimes(1);
    expect(created[0]!.stop).toHaveBeenCalledTimes(1);
  });

  it("raises pitch for later steps to arpeggiate upward", async () => {
    const frequencies: number[] = [];
    class TrackingAudioContext extends FakeAudioContext {
      override createOscillator = vi.fn(() => {
        const osc = new FakeOscillatorNode();
        // Capture the frequency once the caller sets it.
        Object.defineProperty(osc.frequency, "value", {
          get: () => frequencies[frequencies.length - 1] ?? 0,
          set: (v: number) => frequencies.push(v),
        });
        return osc;
      });
    }
    // @ts-expect-error test double constructor
    window.AudioContext = TrackingAudioContext;

    sfx.playTick(0);
    expect(frequencies[0]).toBe(440);

    // Clear the throttle window so the second call isn't dropped as a
    // near-duplicate of the first.
    await new Promise((resolve) => setTimeout(resolve, 40));

    sfx.playTick(3);
    expect(frequencies[1]).toBeGreaterThan(frequencies[0]!);
  });

  it("throttles calls made back-to-back", () => {
    const ctor = vi.fn(() => new FakeAudioContext());
    // @ts-expect-error test double constructor
    window.AudioContext = ctor;

    sfx.playTick(0);
    sfx.playTick(1);

    // getContext() only constructs the AudioContext once even though
    // playTick was called twice — the second call is inside the throttle
    // window and returns before touching the (already-created) context.
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});
