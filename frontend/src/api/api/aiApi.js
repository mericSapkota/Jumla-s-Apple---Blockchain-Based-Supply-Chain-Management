import { Client } from "@gradio/client";

const AI_FRESHNESS_URL = import.meta.env.VITE_AI_FRESHNESS_URL || "";

/**
 * Sends an apple photo to the Gradio freshness-check endpoint.
 * @param {File} file
 * @returns {Promise<{ result: string, raw: any }>}
 */
export async function checkAppleFreshness(file) {
  if (!AI_FRESHNESS_URL) {
    throw new Error("AI freshness endpoint not configured. Set VITE_AI_FRESHNESS_URL in .env.");
  }

  const client = await Client.connect(AI_FRESHNESS_URL);
  const response = await client.predict("/check_apple_condition", {
    input_image: file,
  });

  const raw = response.data;
  console.log(raw);
  // Gradio returns an array — the first element is your JSON output
  const output = Array.isArray(raw) ? raw[0] : raw;
  const healthy = output?.healthy ?? false;
  const rotten = output?.rotten ?? false;
  const result = healthy > rotten ? "FRESH" : "ROTTEN";
  const confidence = Math.max(healthy, rotten) * 100;

  return { result, raw: output, confidence };
}
