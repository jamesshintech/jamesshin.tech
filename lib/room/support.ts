// What the page checks before it loads the room at all. No three.js here:
// this module is in the home page's first load; the room is not.

type NavigatorExtras = Navigator & { connection?: { saveData?: boolean } };

/** The visitor asked their browser to save data: the room stays a picture. */
export function savesData(): boolean {
  return Boolean((navigator as NavigatorExtras).connection?.saveData);
}

/**
 * "gpu": WebGL 2 on a real GPU. "software": WebGL 2 drawn by the CPU
 * (SwiftShader, llvmpipe, Microsoft's Basic Render Driver), where the room
 * would pin a laptop's processor. "none": no WebGL 2. The browser itself
 * reports a software or blocklisted GPU as a major performance caveat; the
 * renderer string catches the ones that do not. The probe's contexts are
 * handed back at once.
 */
export function webglSupport(): "gpu" | "software" | "none" {
  const release = (gl: WebGL2RenderingContext | null) => gl?.getExtension("WEBGL_lose_context")?.loseContext();
  try {
    const fast = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!fast) {
      const any = document.createElement("canvas").getContext("webgl2");
      release(any);
      return any ? "software" : "none";
    }
    // Firefox reports the real renderer here; Chrome and Safari say "WebKit
    // WebGL" and keep it behind the debug extension (asking Firefox for that
    // extension logs a deprecation warning, so it is asked only when needed).
    let renderer = String(fast.getParameter(fast.RENDERER));
    if (/webkit webgl/i.test(renderer)) {
      const info = fast.getExtension("WEBGL_debug_renderer_info");
      if (info) renderer = String(fast.getParameter(info.UNMASKED_RENDERER_WEBGL));
    }
    release(fast);
    return /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i.test(renderer) ? "software" : "gpu";
  } catch {
    return "none";
  }
}
