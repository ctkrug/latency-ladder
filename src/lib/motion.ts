/** True when the visitor has requested reduced motion. Guards for jsdom/old
 * browsers where `matchMedia` doesn't exist rather than throwing. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
