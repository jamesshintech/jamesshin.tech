// JSON-LD goes into a <script> tag through dangerouslySetInnerHTML. JSON.stringify
// does not escape "<", so a value containing "</script>" could end the tag early.
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
