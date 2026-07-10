# Backlog

Stories are marked `[ ]` until built. Every story lists concrete,
verifiable acceptance criteria — no "works well"/"feels good" checks.

## Epic 1 — Live Ladder Core (the wow moment)

### [ ] 1.1 End-to-end measure flow (WOW MOMENT)
Clicking "measure me" runs all four tiers live and ends on the animated,
ordered bar chart plus the generated narrative line.
- [ ] Clicking the button with no prior state produces four rendered bars
      (cache, RAM, IndexedDB, network) and one narrative-line paragraph,
      with no console errors.
- [ ] The bars render in ascending-latency order (fastest tier's bar is
      first in DOM order) regardless of which tier happens to be fastest.
- [ ] The narrative line's ratio number matches
      `slowest.nsPerAccess / fastest.nsPerAccess` (rendered count equals
      that computed value, formatted with thousands separators) within
      rounding.

### [ ] 1.2 Cache/RAM tier accuracy
Tune working-set sizes and trial counts so the two tiers report latencies
in genuinely different orders of magnitude on real hardware.
- [ ] On a real desktop/laptop run (not a VM with unusual cache config),
      the RAM tier's reported ns/access is at least 3x the cache tier's.
- [ ] Reducing `CACHE_WORKING_SET_INTS` by half changes the cache-tier
      result by less than 20% (confirms it's cache-resident, not
      accidentally spilling to a slower tier already).

### [ ] 1.3 IndexedDB tier accuracy
Harden the round-trip measurement against first-run/cold-database skew.
- [ ] The first trial's latency is excluded or warmed up separately so it
      doesn't dominate the trimmed mean (cold database open/create is
      measurably slower than a subsequent get).
- [ ] Running the benchmark twice in the same session reuses the existing
      object store rather than erroring on `onupgradeneeded` firing twice.

### [ ] 1.4 Network tier accuracy
Make the same-origin fetch probe honest about connection state.
- [ ] Requests set `cache: "no-store"` and a unique query string per trial
      (verified: no two trials hit an identical URL).
- [ ] If `fetch` rejects (offline, blocked), the tier surfaces a visible
      error state instead of silently reporting `Infinity`/`NaN`.

### [ ] 1.5 Design polish — measure screen
Bring the live measure screen up to `docs/DESIGN.md`.
- [ ] Fonts (Space Grotesk / IBM Plex Mono), token colors, and radii from
      `docs/DESIGN.md` are applied — no leftover default Vite styling.
- [ ] The button and bars have themed hover/focus-visible/active/disabled
      states (verified by tabbing through and inspecting computed styles).

## Epic 2 — Trust & Robustness

### [ ] 2.1 Outlier handling tuned on real distributions
Validate the trimmed-mean reducer against actual benchmark trial data,
not just the synthetic arrays in `tests/stats.test.ts`.
- [ ] Logging one real run's raw per-trial samples for each tier shows the
      trimmed mean differs from the raw mean by less than 2x in either
      direction (catches a mis-tuned trim fraction).
- [ ] Trial counts are high enough that the trimmed mean is stable: two
      back-to-back computations of the trimmed mean over two random
      half-splits of the same trial set differ by less than 15%.

### [ ] 2.2 Repeatability across runs
- [ ] Clicking "measure again" twice in a row on the same device produces
      results for each tier within the same order of magnitude (ratio
      between the two runs' values for a given tier is between 0.3x-3x).

### [ ] 2.3 Graceful degradation
Handle missing/blocked browser APIs without crashing the page.
- [ ] If `WebAssembly` is undefined, the cache/RAM tiers show a labeled
      "unsupported in this browser" state instead of throwing.
- [ ] If `indexedDB.open` rejects (private-browsing restrictions in some
      browsers), the IndexedDB tier shows an inline error, and the other
      three tiers still render normally (one tier's failure doesn't kill
      the whole run).

## Epic 3 — Delight & Shareability

### [ ] 3.1 Bar-reveal juice
Implement the juice plan from `docs/DESIGN.md` §5.
- [ ] Bars animate in staggered by ~80ms in ascending order (verified:
      each bar's transition-start is later than the previous bar's).
- [ ] A synthesized WebAudio tick fires as each bar lands and a mute
      toggle persists across page reloads via `localStorage`.
- [ ] With `prefers-reduced-motion: reduce`, bars reach final width
      without the staggered tween (an immediate or near-immediate set).

### [ ] 3.2 Re-run and compare
- [ ] "Measure again" re-runs all four tiers and updates the bars/
      narrative in place without a full page reload.
- [ ] The previous run's per-tier values are shown as a faint reference
      marker or delta label alongside the new bars.

### [ ] 3.3 Shareable result card
- [ ] A "copy result" control copies the narrative line plus all four
      raw numbers as plain text to the clipboard (verified via the
      Clipboard API return value / a fallback textarea-select method).

### [ ] 3.4 Design polish — signature detail & responsive composition
- [ ] The animated blueprint-grid background from `docs/DESIGN.md` §4 is
      implemented and respects `prefers-reduced-motion` (static grid, no
      drift, when set).
- [ ] Page renders with no horizontal scroll and no overlapping elements
      at 390px, 768px, and 1440px viewport widths.

## Epic 4 — Ship Readiness

### [ ] 4.1 Accessibility pass
- [ ] Every interactive control (button, mute toggle, copy control) has a
      visible focus ring and, if icon-only, an `aria-label`.
- [ ] The results container is an `aria-live="polite"` region (already
      scaffolded) and announces the narrative line to screen readers
      when it updates.

### [ ] 4.2 Static build verified deployable under a subpath
- [ ] `npm run build` output in `dist/` loads correctly when served from
      a non-root path (e.g. `python3 -m http.server` from inside a
      subdirectory named to mimic `/latency-ladder/`), confirming no
      absolute `/`-rooted asset paths broke anything.
- [ ] `site_build_dir`/`build_cmd` reported in the STATUS block match the
      actual build output directory and command.
