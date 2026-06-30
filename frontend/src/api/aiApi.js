import axios from "axios";

// TODO: replace with your real cloud AI endpoint once confirmed.
// Expected to be set in .env as VITE_AI_FRESHNESS_URL
const AI_FRESHNESS_URL = import.meta.env.VITE_AI_FRESHNESS_URL || "";

/**
 * Sends an apple photo to the freshness-check AI endpoint.
 * @param {File} file
 * @returns {Promise<{ result: string, raw: any }>}
 */
export async function checkAppleFreshness(file) {
  if (!AI_FRESHNESS_URL) {
    throw new Error(
      "AI freshness endpoint not configured yet. Set VITE_AI_FRESHNESS_URL in .env."
    );
  }
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axios.post(AI_FRESHNESS_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Adjust this mapping once the real response shape is known.
  const result = data?.result || data?.aiResult || data?.label || "UNKNOWN";
  return { result, raw: data };
}
