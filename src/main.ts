import { isMuted, playTick, primeAudio, setMuted } from "./audio/sfx";
import { runLadder } from "./benchmarks";
import type { LadderResult } from "./benchmarks";
import { narrativeLine } from "./lib/format";
import { renderBars } from "./ui/bars";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Latency Ladder</h1>
  <p>Live-measured cache, RAM, IndexedDB, and network latency — on your device, right now.</p>
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
  } finally {
    button.disabled = false;
    button.textContent = "Measure again";
  }
});
