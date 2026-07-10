import { formatDuration } from "../lib/format";
import { prefersReducedMotion } from "../lib/motion";
import type { LadderResult } from "../benchmarks";

/** Delay between each successive bar's reveal transition starting, in ms —
 * the "climbing the ladder" stagger from docs/DESIGN.md §5. */
export const BAR_STAGGER_MS = 80;

export interface RenderBarsOptions {
  /** Called once per successful tier, in ascending order, as its bar
   * finishes landing at its target width (immediately if motion is
   * reduced). Used to fire the per-bar landing sound. */
  onBarLanded?: (result: LadderResult) => void;
}

/** Renders `results` as a set of log-scale horizontal bars into `container`.
 * Bar width is proportional to log10(nsPerAccess) so cache/RAM/IndexedDB/
 * network — which span roughly nine orders of magnitude — are all
 * legible on one scale instead of the smallest bars vanishing to zero.
 * Tiers with an `error` render as a labeled failure row instead of a bar,
 * so one tier failing never blanks the whole result. */
export function renderBars(container: HTMLElement, results: LadderResult[], options: RenderBarsOptions = {}): void {
  container.innerHTML = "";
  if (results.length === 0) return;

  const ok = results.filter((r) => r.error === null);
  const logValues = ok.map((r) => Math.log10(r.nsPerAccess!));
  const minLog = logValues.length ? Math.min(...logValues) : 0;
  const maxLog = logValues.length ? Math.max(...logValues) : 0;
  const range = maxLog - minLog || 1;
  const reducedMotion = prefersReducedMotion();

  const list = document.createElement("ol");
  list.className = "ladder-bars";
  let okIndex = 0;

  results.forEach((result) => {
    const row = document.createElement("li");

    if (result.error !== null) {
      row.className = "ladder-row ladder-row--error";

      const label = document.createElement("span");
      label.className = "ladder-label";
      label.textContent = result.label;

      const message = document.createElement("span");
      message.className = "ladder-error";
      message.textContent = result.error;

      row.append(label, message);
      list.appendChild(row);
      return;
    }

    row.className = "ladder-row";
    const pct = ((Math.log10(result.nsPerAccess!) - minLog) / range) * 100;

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
    fill.style.transitionDelay = reducedMotion ? "0ms" : `${okIndex * BAR_STAGGER_MS}ms`;
    okIndex += 1;

    if (options.onBarLanded) {
      if (reducedMotion) {
        // No transition will run, so there's no transitionend to hook —
        // report the landing on the next tick instead.
        queueMicrotask(() => options.onBarLanded!(result));
      } else {
        fill.addEventListener("transitionend", (event) => {
          if (event.propertyName === "width") options.onBarLanded!(result);
        });
      }
    }

    const value = document.createElement("span");
    value.className = "ladder-value";
    value.textContent = formatDuration(result.nsPerAccess!);

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
