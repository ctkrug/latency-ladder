import { isMuted, playTick, primeAudio, setMuted } from "./audio/sfx";
import { runLadder } from "./benchmarks";
import type { LadderResult } from "./benchmarks";
import { copyText } from "./lib/clipboard";
import { narrativeLine, shareText } from "./lib/format";
import { renderBars } from "./ui/bars";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="wordmark">
    <svg class="wordmark-glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="1" y="21" width="5" height="6" rx="1.5" fill="currentColor" />
      <rect x="8" y="15" width="5" height="12" rx="1.5" fill="currentColor" />
      <rect x="15" y="9" width="5" height="18" rx="1.5" fill="currentColor" />
      <rect x="22" y="4" width="1.8" height="23" rx="0.9" fill="currentColor" opacity="0.5" />
    </svg>
    <h1>Latency <span class="wordmark-accent">Ladder</span></h1>
  </div>
  <p class="tagline">Live-measured cache, RAM, IndexedDB, and network latency — on your device, right now.</p>
  <div class="controls">
    <button class="measure-button" id="measure">Measure me</button>
    <button class="mute-toggle" id="mute" type="button" aria-pressed="false" aria-label="Mute sound"></button>
  </div>
  <div id="results" aria-live="polite"></div>
`;

const button = app.querySelector<HTMLButtonElement>("#measure")!;
const muteButton = app.querySelector<HTMLButtonElement>("#mute")!;
const results = app.querySelector<HTMLDivElement>("#results")!;

let previousLadder: LadderResult[] | null = null;

function syncMuteButton(): void {
  const muted = isMuted();
  muteButton.textContent = muted ? "🔇" : "🔊";
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButton.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
}

syncMuteButton();

muteButton.addEventListener("click", () => {
  setMuted(!isMuted());
  syncMuteButton();
});

button.addEventListener("click", async () => {
  primeAudio();
  button.disabled = true;
  button.textContent = "Measuring…";
  results.innerHTML = "";

  try {
    const ladder = await runLadder();
    let landedCount = 0;
    renderBars(results, ladder, {
      previous: previousLadder ?? undefined,
      onBarLanded: () => {
        playTick(landedCount);
        landedCount += 1;
      },
    });
    previousLadder = ladder;

    const ok = ladder.filter((r) => r.error === null);
    if (ok.length >= 2) {
      const slowest = ok[ok.length - 1]!;
      const fastest = ok[0]!;
      const narrative = document.createElement("p");
      narrative.className = "ladder-narrative";
      narrative.textContent = narrativeLine(
        slowest.label.toLowerCase(),
        slowest.nsPerAccess!,
        `${fastest.label.toLowerCase()} accesses`,
        fastest.nsPerAccess!,
      );
      results.appendChild(narrative);
    }

    const copyRow = document.createElement("div");
    copyRow.className = "copy-row";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy result";

    const copyStatus = document.createElement("span");
    copyStatus.className = "copy-status";
    copyStatus.setAttribute("aria-live", "polite");

    copyButton.addEventListener("click", async () => {
      const succeeded = await copyText(shareText(ladder));
      copyStatus.textContent = succeeded ? "Copied!" : "Couldn't copy — select and copy manually.";
    });

    copyRow.append(copyButton, copyStatus);
    results.appendChild(copyRow);
  } finally {
    button.disabled = false;
    button.textContent = "Measure again";
  }
});
