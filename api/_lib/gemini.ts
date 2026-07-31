import { GoogleGenAI } from "@google/genai";

// Nota: en Vercel las variables de entorno ya están disponibles en
// process.env sin necesidad de dotenv (eso solo hacía falta para el
// servidor Express local).
function getEffectiveApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().startsWith("AIzaSy")) {
    return envKey.trim();
  }
  return null;
}

export function hasValidApiKey(): boolean {
  return getEffectiveApiKey() !== null;
}

// Nota: cada función serverless de Vercel corre en su propia instancia,
// así que este cache solo sirve dentro de invocaciones "calientes" de la
// MISMA función (no se comparte entre weather.ts, chat.ts y moderar.ts).
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
