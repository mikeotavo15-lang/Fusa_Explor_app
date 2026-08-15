import { GoogleGenAI } from "@google/genai";
function getEffectiveApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && (envKey.trim().startsWith("AIzaSy") || envKey.trim().startsWith("AQ."))) {
    return envKey.trim();
  }
  return null;
}

export function hasValidApiKey(): boolean {
  return getEffectiveApiKey() !== null;
}

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error("No valid GEMINI_API_KEY configured.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}