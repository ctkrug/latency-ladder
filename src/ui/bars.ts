import { formatDuration } from "../lib/format";
import type { LadderResult } from "../benchmarks";

/** Renders `results` as a set of log-scale horizontal bars into `container`.
 * Bar width is proportional to log10(nsPerAccess) so cache/RAM/IndexedDB/
 * network — which span roughly nine orders of magnitude — are all
 * legible on one scale instead of the smallest bars vanishing to zero. */
export function renderBars(container: HTMLElement, results: LadderResult[]): void {
  container.innerHTML = "";
  if (results.length === 0) return;

  const logValues = results.map((r) => Math.log10(r.nsPerAccess));
  const minLog = Math.min(...logValues);
  const maxLog = Math.max(...logValues);
  const range = maxLog - minLog || 1;

  const list = document.createElement("ol");
  list.className = "ladder-bars";

  results.forEach((result, i) => {
    const pct = ((logValues[i]! - minLog) / range) * 100;

    const row = document.createElement("li");
    row.className = "ladder-row";

    const label = document.createElement("span");
    label.className = "ladder-label";
    label.textContent = result.label;

    const track = document.createElement("span");
    track.className = "ladder-track";

    const fill = document.createElement("span");
    fill.className = "ladder-fill";
    // Start collapsed; caller triggers the animation by setting this after
    // the element is in the DOM (a width transition needs two frames).
    fill.style.width = "0%";
    fill.dataset.targetWidth = `${Math.max(pct, 4)}%`;

    const value = document.createElement("span");
    value.className = "ladder-value";
    value.textContent = formatDuration(result.nsPerAccess);

    track.appendChild(fill);
    row.append(label, track, value);
    list.appendChild(row);
  });

  container.appendChild(list);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      list.querySelectorAll<HTMLElement>(".ladder-fill").forEach((fill) => {
        fill.style.width = fill.dataset.targetWidth ?? "0%";
      });
    });
  });
}
