import type { CoachContextPayload } from "./coach-contract";

/**
 * Gemini's tokenizer tends to emit an extra "1" after the ₹ glyph (₹3,430 becomes
 * ₹13,430). Sending an ASCII marker instead avoids that, and the marker is
 * restored to the real symbol before the reply reaches the UI.
 */
export function toModelContext(context: CoachContextPayload): CoachContextPayload {
  return JSON.parse(JSON.stringify(context).replace(/₹/g, "INR ")) as CoachContextPayload;
}

export function restoreINR(text: string): string {
  return text.replace(/INR\s*/g, "₹");
}
