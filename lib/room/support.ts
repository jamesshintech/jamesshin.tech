// What the page checks before it loads the room at all. No three.js here:
// this module is in the home page's first load; the room is not.

type NavigatorExtras = Navigator & { connection?: { saveData?: boolean } };

/** The visitor asked their browser to save data: the room stays a picture. */
export function savesData(): boolean {
  return Boolean((navigator as NavigatorExtras).connection?.saveData);
}

/** WebGL 2 is what the room needs; the probe's context is handed back at once. */
export function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
