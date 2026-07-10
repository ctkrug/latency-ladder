function copyViaTextarea(text: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

/** Copies `text` to the clipboard, preferring the async Clipboard API and
 * falling back to a hidden-textarea `execCommand("copy")` when it's
 * unavailable or rejects (older browsers, insecure contexts). Returns
 * whether the copy is believed to have succeeded. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the textarea fallback below
    }
  }
  return copyViaTextarea(text);
}
