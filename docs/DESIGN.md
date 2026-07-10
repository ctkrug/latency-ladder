# Design

## 1. Aesthetic direction

**Blueprint/technical.** Latency Ladder is an instrument, not a toy app — it
should read like a schematic for your own hardware: deep engineering-blueprint
navy, a faint cyan grid like graph paper, thin precise rule lines instead of
soft drop shadows, and monospace numerals everywhere a measurement appears.
The feeling is "oscilloscope readout," not "marketing dashboard."

This deliberately avoids the generic "dark gray cards + one accent" default:
the grid-paper background treatment, the mono-numeral readouts, and the
orange support accent (used only for the payoff line) are what make it a
blueprint rather than just another dark theme.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a1628` | page background (deep blueprint navy) |
| `--surface` | `#0f2038` | bar tracks, panels |
| `--surface-raised` | `#15304f` | hovered/raised panels |
| `--text` | `#e8f1fa` | primary text |
| `--text-muted` | `#7fa3c4` | secondary text, labels |
| `--accent` | `#00e5ff` | primary accent — bars, focus rings, links (cyan ink) |
| `--accent-support` | `#ff6b4a` | the payoff narrative line only — warm contrast against the cyan/navy field |
| `--success` | `#4ade80` | (reserved; no success state in v1) |
| `--danger` | `#ff5470` | error states (benchmark failure, unsupported API) |
| Display font | **Space Grotesk** (Google Fonts) | wordmark, headings — geometric, technical |
| UI/data font | **IBM Plex Mono** (Google Fonts) | body copy, labels, and every measured number — tabular figures read like an instrument |
| System fallback | `system-ui, -apple-system, sans-serif` | both, until fonts load |
| Spacing unit | 8px scale: 4/8/16/24/32/48/64 | all margins/padding/gaps |
| Corner radius | `4px` (small), `8px` (panels) | sharp, drafted — not soft/glassy |
| Line/shadow style | 1px `--accent` at 20-30% opacity rules instead of blurred shadows; a subtle `--accent` glow (`box-shadow: 0 0 16px rgba(0,229,255,.25)`) only on the active/focused element | schematic linework, not soft depth |
| Motion (UI) | 150-220ms ease-out | hovers, focus, panel transitions |
| Motion (bar reveal) | 500-700ms ease-out, staggered ~80ms per bar | the wow moment gets more time than a routine hover |

## 3. Layout intent

**Hero = the ladder itself.** The measure button and, after the first click,
the four bars + narrative line are the whole page — no sidebar, no feature
grid, no marketing filler around them.

- **Desktop (1440×900):** centered column, max-width ~760px, but the ladder
  bars stretch to that full width once populated — they're the widest, most
  visually dominant element on the page (~65% of viewport height once
  results are showing: headline + button top, four bars + narrative
  filling the rest). Background carries a faint animated blueprint grid
  (see §4) so the space around the centered column is never empty/dead.
- **Phone (390×844):** same vertical stack, bars go full-width with the
  label above the track instead of beside it if a row would otherwise
  wrap awkwardly; button and touch targets ≥44px; grid background scales
  down in density so it doesn't look busy on a small screen.

## 4. Signature detail

A **faint animated blueprint grid** drifts almost imperceptibly (a slow
diagonal parallax, a few px over many seconds) behind the content — the
one flourish that makes the background feel alive without competing with
the bars. The wordmark pairs the ascending-bar glyph from the favicon with
"Latency Ladder" set in Space Grotesk, letter-spaced slightly wide like a
technical label.

## 5. Juice plan (interactive toy, not a game, but the reveal is the product)

- **Button press:** immediate depress + `--accent` glow pulse (<100ms).
- **Bar reveal:** each bar's fill tweens from 0 to its target width in
  500-700ms ease-out, staggered ~80ms apart in ascending-latency order —
  the "climbing the ladder" motion the name promises.
- **Landing feedback:** as each bar finishes its tween, a short synthesized
  WebAudio "tick" (a filtered click, pitched slightly higher for each
  successive/faster tier) — four rising ticks, like a countdown reading
  out loud.
- **Payoff moment:** once all four bars have landed, the narrative line
  fades/slides in with a slightly longer, lower synthesized "resolve" tone
  — the one moment the page treats as a small celebration.
- **Mute toggle:** persisted in `localStorage`; `AudioContext` created
  lazily on the first click (autoplay policy) and the whole audio path is
  optional — the page works identically muted or in environments without
  `AudioContext`.
- Respect `prefers-reduced-motion`: bars still reach their final width but
  skip the tween/stagger; ticks are unaffected (they're audio, not motion).

Every later build/QA pass follows this file. Changing direction after this
point is a deliberate, called-out decision in its own commit.
