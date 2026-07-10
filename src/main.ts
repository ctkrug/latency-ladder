import { runLadder } from "./benchmarks";
import { narrativeLine } from "./lib/format";
import { renderBars } from "./ui/bars";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Latency Ladder</h1>
  <p>Live-measured cache, RAM, IndexedDB, and network latency — on your device, right now.</p>
  <button class="measure-button" id="measure">Measure me</button>
  <div id="results" aria-live="polite"></div>
`;

const button = app.querySelector<HTMLButtonElement>("#measure")!;
const results = app.querySelector<HTMLDivElement>("#results")!;

button.addEventListener("click", async () => {
  button.disabled = true;
  button.textContent = "Measuring…";
  results.innerHTML = "";

  try {
    const ladder = await runLadder();
    renderBars(results, ladder);

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
