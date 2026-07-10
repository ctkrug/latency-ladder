import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LadderResult } from "../src/benchmarks";

const { runLadder } = vi.hoisted(() => ({ runLadder: vi.fn() }));
const { isMuted, setMuted, playTick, primeAudio } = vi.hoisted(() => ({
  isMuted: vi.fn(() => false),
  setMuted: vi.fn(),
  playTick: vi.fn(),
  primeAudio: vi.fn(),
}));
const { copyText } = vi.hoisted(() => ({ copyText: vi.fn() }));

vi.mock("../src/benchmarks", () => ({ runLadder }));
vi.mock("../src/audio/sfx", () => ({ isMuted, setMuted, playTick, primeAudio }));
vi.mock("../src/lib/clipboard", () => ({ copyText }));

const RUN_1: LadderResult[] = [
  { label: "Cache", nsPerAccess: 2, error: null },
  { label: "RAM", nsPerAccess: 200, error: null },
];

async function mountApp(): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>';
  await import("../src/main");
}

describe("main app wiring", () => {
  beforeEach(() => {
    vi.resetModules();
    runLadder.mockReset();
    isMuted.mockReset().mockReturnValue(false);
    setMuted.mockReset();
    playTick.mockReset();
    primeAudio.mockReset();
    copyText.mockReset().mockResolvedValue(true);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("runs the ladder and renders bars plus a narrative line on click", async () => {
    runLadder.mockResolvedValue(RUN_1);
    await mountApp();

    document.querySelector<HTMLButtonElement>("#measure")!.click();
    await vi.waitFor(() => expect(runLadder).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(document.querySelector(".ladder-narrative")).not.toBeNull());

    expect(document.querySelectorAll(".ladder-row")).toHaveLength(2);
    expect(document.querySelector(".ladder-narrative")!.textContent).toContain("slower than");
  });

  it("ignores a rapid second click while a run is still in flight", async () => {
    let resolveRun!: (value: LadderResult[]) => void;
    runLadder.mockReturnValue(new Promise((resolve) => (resolveRun = resolve)));
    await mountApp();

    const button = document.querySelector<HTMLButtonElement>("#measure")!;
    button.click();
    // The button is synchronously disabled before the first await, so a
    // same-tick second click (double-click, key-repeat) must not fire the
    // handler again and start a second concurrent measurement.
    button.click();
    button.click();

    resolveRun(RUN_1);
    await vi.waitFor(() => expect(button.disabled).toBe(false));

    expect(runLadder).toHaveBeenCalledTimes(1);
  });

  it("re-enables the button and relabels it 'Measure again' after a run", async () => {
    runLadder.mockResolvedValue(RUN_1);
    await mountApp();

    const button = document.querySelector<HTMLButtonElement>("#measure")!;
    button.click();
    await vi.waitFor(() => expect(button.disabled).toBe(false));

    expect(button.textContent).toBe("Measure again");
  });

  it("passes the previous run into the next renderBars call as a comparison marker", async () => {
    const RUN_2: LadderResult[] = [
      { label: "Cache", nsPerAccess: 4, error: null },
      { label: "RAM", nsPerAccess: 400, error: null },
    ];
    runLadder.mockResolvedValueOnce(RUN_1).mockResolvedValueOnce(RUN_2);
    await mountApp();

    const button = document.querySelector<HTMLButtonElement>("#measure")!;
    button.click();
    await vi.waitFor(() => expect(button.disabled).toBe(false));

    button.click();
    await vi.waitFor(() => expect(runLadder).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelectorAll(".ladder-marker").length).toBeGreaterThan(0));
  });

  it("wires the mute toggle to setMuted and re-syncs its label", async () => {
    // Mirror the real isMuted/setMuted contract (a shared boolean) rather
    // than a fixed call-count sequence, since main.ts calls isMuted() once
    // to decide the toggle and again afterward to re-sync the button label.
    let muted = false;
    isMuted.mockImplementation(() => muted);
    setMuted.mockImplementation((next: boolean) => {
      muted = next;
    });
    await mountApp();

    const muteButton = document.querySelector<HTMLButtonElement>("#mute")!;
    expect(muteButton.getAttribute("aria-pressed")).toBe("false");

    muteButton.click();

    expect(setMuted).toHaveBeenCalledWith(true);
    expect(muteButton.getAttribute("aria-pressed")).toBe("true");
    expect(muteButton.getAttribute("aria-label")).toBe("Unmute sound");
  });

  it("calls playTick with an incrementing step as each real bar lands", async () => {
    // main.ts renders real bars (not mocked) so this exercises the actual
    // renderBars <-> onBarLanded wiring, not just a mocked runLadder.
    runLadder.mockResolvedValue(RUN_1);
    await mountApp();

    document.querySelector<HTMLButtonElement>("#measure")!.click();
    await vi.waitFor(() => expect(document.querySelectorAll(".ladder-fill").length).toBe(2));

    const fills = Array.from(document.querySelectorAll<HTMLElement>(".ladder-fill"));
    fills.forEach((fill) => {
      const event = new Event("transitionend") as Event & { propertyName: string };
      Object.defineProperty(event, "propertyName", { value: "width" });
      fill.dispatchEvent(event);
    });

    expect(playTick).toHaveBeenNthCalledWith(1, 0);
    expect(playTick).toHaveBeenNthCalledWith(2, 1);
  });

  it("copies the share text and reports success when the copy button is clicked", async () => {
    runLadder.mockResolvedValue(RUN_1);
    copyText.mockResolvedValue(true);
    await mountApp();

    document.querySelector<HTMLButtonElement>("#measure")!.click();
    await vi.waitFor(() => expect(document.querySelector(".copy-button")).not.toBeNull());

    document.querySelector<HTMLButtonElement>(".copy-button")!.click();
    await vi.waitFor(() => expect(copyText).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(document.querySelector(".copy-status")!.textContent).toBe("Copied!"));
  });

  it("shows a fallback message when copyText reports failure", async () => {
    runLadder.mockResolvedValue(RUN_1);
    copyText.mockResolvedValue(false);
    await mountApp();

    document.querySelector<HTMLButtonElement>("#measure")!.click();
    await vi.waitFor(() => expect(document.querySelector(".copy-button")).not.toBeNull());

    document.querySelector<HTMLButtonElement>(".copy-button")!.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".copy-status")!.textContent).toBe("Couldn't copy — select and copy manually."),
    );
  });
});
