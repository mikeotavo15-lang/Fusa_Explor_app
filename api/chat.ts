import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGeminiClient, hasValidApiKey } from "./_lib/gemini";
import { getLocalHeuristicResponse, systemInstruction } from "./_lib/chat-assistant";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { message, chatHistory, lugares, categorias } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    if (hasValidApiKey()) {
      try {
        const client = getGeminiClient();

        const placesContext = (lugares || [])
          .map((l: any) => {
            const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
            return `- **${l.nombre}**: ${
              l.descripcion || "Lugar increíble en Fusagasugá."
            } (Categoría: ${cat ? cat.nombre : "General"}, Dirección: ${
              l.direccion || "Escríbenos para saber más"
            }, Calificación: ⭐${l.puntuacion || "N/A"})`;
          })
          .join("\n");

        const fullSystemInstruction = `${systemInstruction}\n\nINFORMACIÓN ACTUAL DE LA APLICACIÓN Fusa Explor (Usa estos lugares para tus recomendaciones):\n${placesContext}`;

        const formattedHistory = (chatHistory || []).map((msg: any) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

        const chat = client.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: fullSystemInstruction,
          },
          history: formattedHistory,
        });

        const result = await chat.sendMessage({ message });
        return res.status(200).json({ response: result.text });
      } catch (geminiError: any) {
        console.warn(
          "Gemini API execution failed, falling back to local heuristic matching engine... Error:",
          geminiError
        );
        const heuristicText = getLocalHeuristicResponse(message, lugares, categorias);
        return res.status(200).json({ response: heuristicText });
      }
    } else {
      const heuristicText = getLocalHeuristicResponse(message, lugares, categorias);
      return res.status(200).json({ response: heuristicText });
    }
  } catch (error: any) {
    console.error("Error in assistant API:", error);
    return res.status(500).json({
      error: "Surgió un inconveniente en el canal de Fusa Guía.",
      details: error.message,
    });
  }
}
