import type { VercelRequest, VercelResponse } from "@vercel/node";
import { moderarContenidoTuristico } from "./_lib/moderation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { texto, imagenBase64 } = req.body || {};
    const result = await moderarContenidoTuristico(texto || "", imagenBase64);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error en endpoint de moderación:", error);
    return res.status(200).json({
      aprobado: true,
      categoriaInfraccion: "ninguno",
      motivo: "Aprobado por contingencia técnica.",
    });
  }
}
