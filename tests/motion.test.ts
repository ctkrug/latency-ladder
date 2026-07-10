import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "../src/lib/motion";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when matchMedia is unavailable", () => {
    // @ts-expect-error simulating an environment without matchMedia
    delete window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });

  it("returns true when the media query matches", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
  });

  it("returns false when the media query does not match", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });
});
