/** Opens a URL in the system's default browser via Electron's shell, falling back to a plain
 * window.open when previewed in a regular browser (no electronBridge available). */
export function openExternal(url: string) {
  if (window.electronBridge) {
    window.electronBridge.openExternal(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
