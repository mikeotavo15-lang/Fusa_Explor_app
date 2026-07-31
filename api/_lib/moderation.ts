import { Type } from "@google/genai";
import { getGeminiClient, hasValidApiKey } from "./gemini";

export interface ModerationResult {
  aprobado: boolean;
  categoriaInfraccion: string;
  motivo: string;
}

const colombianProfanitiesRegex =
  /\b(gonorrea|gonorreas|gonorriento|malparido|malparida|malparidos|malparidas|hijueputa|hijueputas|hijo\s*de\s*puta|hijos\s*de\s*puta|jueputa|jueputas|triplehijueputa|catrehijueputa|perra|perras|maricon|maricón|maricones|carechimba|pirobo|pirobos|piroba|garulla|cacorro)\b/i;

export async function moderarContenidoTuristico(
  texto: string,
  imagenBase64?: string // Opcional, formato: "data:image/jpeg;base64,..."
): Promise<ModerationResult> {
  // Pre-filtro local para groserías e insultos colombianos comunes
  if (texto && colombianProfanitiesRegex.test(texto)) {
    return {
      aprobado: false,
      categoriaInfraccion: "insulto",
      motivo: "El texto contiene lenguaje, insultos o groserías inapropiadas.",
    };
  }

  if (!hasValidApiKey()) {
    return {
      aprobado: true,
      categoriaInfraccion: "ninguno",
      motivo: "Aprobado por defecto (clave API no configurada)",
    };
  }

  const ai = getGeminiClient();

  const contents: any[] = [
    `Actúa como un moderador estricto para Fusa Explor, una aplicación de turismo de Colombia.
     Analiza el texto adjunto (y la imagen si está presente). 
     Busca contenido inapropiado como:
     - Groserías, insultos o vulgaridades en español y regionalismos colombianos (ejemplo: gonorrea, malparido, hijueputa, jueputa, perra, maricón, carechimba, pirobo, garulla, etc.).
     - Discriminación, acoso, odio o violencia.
     - Spam político, comercial o enlaces sospechosos.
     - Desnudez, contenido explícito o vandalismo.
     - Ubicaciones o nombres falsos/ficticios de broma.
     
     Texto enviado por el usuario: "${texto}"`,
  ];

  if (imagenBase64) {
    const [meta, data] = imagenBase64.split(",");
    const mimeType = meta ? meta.match(/:(.*?);/)?.[1] || "image/jpeg" : "image/jpeg";
    contents.push({
      inlineData: { data: data || imagenBase64, mimeType },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aprobado: {
            type: Type.BOOLEAN,
            description:
              "false si viola las políticas de turismo, acoso, insultos colombianos, spam o imágenes explícitas, de lo contrario true",
          },
          categoriaInfraccion: {
            type: Type.STRING,
            description:
              "Categoría de la falta si no es aprobado (insulto, contenido_adulto, spam, ubicacion_falsa, vandalismo, ninguno)",
          },
          motivo: {
            type: Type.STRING,
            description: "Explicación breve de por qué se rechaza o aprueba",
          },
        },
        required: ["aprobado", "categoriaInfraccion", "motivo"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as ModerationResult;
}
