import { afterEach, describe, expect, it, vi } from "vitest";
import { BAR_STAGGER_MS, renderBars } from "../src/ui/bars";
import type { LadderResult } from "../src/benchmarks";

const OK: LadderResult[] = [
  { label: "Cache", nsPerAccess: 1, error: null },
  { label: "RAM", nsPerAccess: 100, error: null },
  { label: "IndexedDB", nsPerAccess: 5_000_000, error: null },
];

const WITH_ERROR: LadderResult[] = [
  { label: "Cache", nsPerAccess: 1, error: null },
  { label: "RAM", nsPerAccess: null, error: "WebAssembly unsupported in this browser" },
];

function container(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("renderBars", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error resetting the ad-hoc matchMedia stub between tests
    delete window.matchMedia;
    document.body.innerHTML = "";
  });

  it("renders nothing for an empty result set", () => {
    const c = container();
    renderBars(c, []);
    expect(c.innerHTML).toBe("");
  });

  it("staggers each successive bar's transition-delay by BAR_STAGGER_MS", () => {
    const c = container();
    renderBars(c, OK);

    const delays = Array.from(c.querySelectorAll<HTMLElement>(".ladder-fill")).map(
      (fill) => fill.style.transitionDelay,
    );
    expect(delays).toEqual(["0ms", `${BAR_STAGGER_MS}ms`, `${BAR_STAGGER_MS * 2}ms`]);
  });

  it("renders a failed tier as a labeled error row instead of a bar", () => {
    const c = container();
    renderBars(c, WITH_ERROR);

    const errorRow = c.querySelector(".ladder-row--error")!;
    expect(errorRow).not.toBeNull();
    expect(errorRow.querySelector(".ladder-error")?.textContent).toBe(
      "WebAssembly unsupported in this browser",
    );
    // The failed tier gets no .ladder-fill bar.
    expect(c.querySelectorAll(".ladder-fill")).toHaveLength(1);
  });

  it("skips the stagger and reports landing on the next tick under reduced motion", async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    const c = container();
    const landed: string[] = [];
    renderBars(c, OK, { onBarLanded: (r) => landed.push(r.label) });

    Array.from(c.querySelectorAll<HTMLElement>(".ladder-fill")).forEach((fill) => {
      expect(fill.style.transitionDelay).toBe("0ms");
    });

    await Promise.resolve();
    expect(landed).toEqual(["Cache", "RAM", "IndexedDB"]);
  });

  it("reports landing via transitionend when motion is not reduced", () => {
    const c = container();
    const landed: string[] = [];
    renderBars(c, OK, { onBarLanded: (r) => landed.push(r.label) });

    const fills = Array.from(c.querySelectorAll<HTMLElement>(".ladder-fill"));
    const event = new Event("transitionend") as Event & { propertyName: string };
    Object.defineProperty(event, "propertyName", { value: "width" });
    fills[0]!.dispatchEvent(event);

    expect(landed).toEqual(["Cache"]);
  });
});
