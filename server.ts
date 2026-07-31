import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;

function getEffectiveApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().startsWith("AIzaSy")) {
    return envKey.trim();
  }
  return null;
}

function hasValidApiKey(): boolean {
  return getEffectiveApiKey() !== null;
}

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error("No valid GEMINI_API_KEY configured.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface ModerationResult {
  aprobado: boolean;
  categoriaInfraccion: string;
  motivo: string;
}

export async function moderarContenidoTuristico(
  texto: string, 
  imagenBase64?: string // Opcional, formato: "data:image/jpeg;base64,..."
): Promise<ModerationResult> {
  // Pre-filtro local para groserías e insultos colombianos comunes
  const colombianProfanitiesRegex = /\b(gonorrea|gonorreas|gonorriento|malparido|malparida|malparidos|malparidas|hijueputa|hijueputas|hijo\s*de\s*puta|hijos\s*de\s*puta|jueputa|jueputas|triplehijueputa|catrehijueputa|perra|perras|maricon|maricón|maricones|carechimba|pirobo|pirobos|piroba|garulla|cacorro)\b/i;

  if (texto && colombianProfanitiesRegex.test(texto)) {
    return {
      aprobado: false,
      categoriaInfraccion: "insulto",
      motivo: "El texto contiene lenguaje, insultos o groserías inapropiadas."
    };
  }

  if (!hasValidApiKey()) {
    return {
      aprobado: true,
      categoriaInfraccion: "ninguno",
      motivo: "Aprobado por defecto (clave API no configurada)"
    };
  }

  const ai = getGeminiClient();
  
  // Preparamos el contenido multimodal de la solicitud con énfasis en lenguaje y groserías colombianas
  const contents: any[] = [
    `Actúa como un moderador estricto para Fusa Explor, una aplicación de turismo de Colombia.
     Analiza el texto adjunto (y la imagen si está presente). 
     Busca contenido inapropiado como:
     - Groserías, insultos o vulgaridades en español y regionalismos colombianos (ejemplo: gonorrea, malparido, hijueputa, jueputa, perra, maricón, carechimba, pirobo, garulla, etc.).
     - Discriminación, acoso, odio o violencia.
     - Spam político, comercial o enlaces sospechosos.
     - Desnudez, contenido explícito o vandalismo.
     - Ubicaciones o nombres falsos/ficticios de broma.
     
     Texto enviado por el usuario: "${texto}"`
  ];

  // Si el usuario subió una foto, la agregamos al análisis
  if (imagenBase64) {
    const [meta, data] = imagenBase64.split(',');
    const mimeType = meta ? (meta.match(/:(.*?);/)?.[1] || 'image/jpeg') : 'image/jpeg';
    contents.push({
      inlineData: { data: data || imagenBase64, mimeType }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aprobado: { 
            type: Type.BOOLEAN, 
            description: "false si viola las políticas de turismo, acoso, insultos colombianos, spam o imágenes explícitas, de lo contrario true" 
          },
          categoriaInfraccion: { 
            type: Type.STRING, 
            description: "Categoría de la falta si no es aprobado (insulto, contenido_adulto, spam, ubicacion_falsa, vandalismo, ninguno)" 
          },
          motivo: { 
            type: Type.STRING, 
            description: "Explicación breve de por qué se rechaza o aprueba" 
          }
        },
        required: ["aprobado", "categoriaInfraccion", "motivo"],
      }
    }
  });

  return JSON.parse(response.text || '{}') as ModerationResult;
}

const systemInstruction = `Eres "Fusa Guía", el asistente virtual oficial de la aplicación Fusa Explor, diseñado para ser un guía turístico interactivo, alegre y experto de Fusagasugá (Cundinamarca, Colombia).

Tu misión es ayudar a los turistas y locales a descubrir los mejores lugares de Fusagasugá basándote únicamente en la información de los lugares de la app proporcionada como contexto.

REGLAS ABSOLUTAS:
1. Habla con un tono amigable, entusiasta, cálido, típico de un guía turístico de Colombia. Usa expresiones alegres como "¡Hola, explorador de Fusa!", o invitaciones entusiastas.
2. Basate en los lugares cargados en la aplicación para tus recomendaciones. Si el usuario te pregunta dónde comer, pasear, o hospedarse, menciónale los lugares específicos cargados de Fusa Explor y haz que suenen atractivos.
3. NO menciones bajo ninguna circunstancia información sobre bases de datos, código fuente, Firebase, react, esquemas SQL, ID de documentos Firestore, API, o implementaciones técnicas. Si te preguntan sobre cómo funciona el código o la base de datos de la app, diles amablemente con carisma que eres un guía turístico experto en gastronomía, cultura y naturaleza de Fusagasugá, y no un ingeniero de sistemas.
4. Si el usuario pregunta por algo de Fusagasugá que NO está en la lista de lugares, puedes responder con cultura, historia general útil o el delicioso clima fresquito de la ciudad, pero invítalos a registrar esa nueva experiencia o lugar en Fusa Explor en la sección de administración si son administradores.
5. Brinda respuestas claras, bonitas, estructuradas y descriptivas usando formato Markdown (con negritas, listas cortas y emojis de flores, sol, café, etc.) para que se lean de forma espectacular.`;

function getLocalHeuristicResponse(message: string, lugares: any[], categorias: any[]): string {
  const query = message.toLowerCase();
  
  const matches = (lugares || []).filter((l: any) => {
    const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
    const catName = cat ? cat.nombre.toLowerCase() : "";
    return (
      l.nombre.toLowerCase().includes(query) ||
      (l.descripcion || "").toLowerCase().includes(query) ||
      (l.direccion || "").toLowerCase().includes(query) ||
      catName.includes(query)
    );
  });

  let matchedIntro = "";
  if (query.includes("hola") || query.includes("saludo") || query.includes("buenos") || query.includes("buenas")) {
    matchedIntro = "¡Hola, explorador de Fusa! 🌟 Qué alegría saludarte. ";
  }

  if (matches.length > 0) {
    const placesList = matches.map((l: any) => {
      const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
      return `📍 **${l.nombre}**\n   *Categoría:* ${cat ? cat.nombre : 'General'}\n   *Dirección:* ${l.direccion || 'Fusagasugá'}\n   *Calificación:* ⭐${l.puntuacion || '4.5'}/5\n   _${l.descripcion || 'Una experiencia maravillosa te espera aquí.'}_`;
    }).join("\n\n");

    return `${matchedIntro}Basándome en lo que buscas, he encontrado estas excelentes opciones cargadas en Fusa Explor para ti:\n\n${placesList}\n\n¡Espero que te gusten! Recuerda que puedes descubrir más detalles tocándolos directamente en el mapa. 🗺️🌸`;
  }

  if (query.includes("comer") || query.includes("restaurante") || query.includes("hambre") || query.includes("comida") || query.includes("café") || query.includes("cafe")) {
    const foodPlaces = (lugares || []).filter((l: any) => {
      const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
      const catNorm = cat ? cat.nombre.toLowerCase() : "";
      return catNorm.includes("comida") || catNorm.includes("restaurante") || catNorm.includes("caf") || l.nombre.toLowerCase().includes("caf") || l.descripcion.toLowerCase().includes("comida");
    });
    if (foodPlaces.length > 0) {
      return `${matchedIntro}¡Claro que sí! Si deseas deleitar tu paladar con la espectacular gastronomía de Fusagasugá, aquí tienes opciones fabulosas cargadas en nuestra app:\n\n` + 
        foodPlaces.map(l => `🍴 **${l.nombre}**: ${l.descripcion} (${l.direccion || 'Fusagasugá'})`).join("\n\n");
    }
  }

  if (query.includes("hosped") || query.includes("hotel") || query.includes("dormir") || query.includes("alojar") || query.includes("finca")) {
    const lodgPlaces = (lugares || []).filter((l: any) => {
      const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
      const catNorm = cat ? cat.nombre.toLowerCase() : "";
      return catNorm.includes("hotel") || catNorm.includes("hospedaje") || catNorm.includes("alojamiento") || l.descripcion.toLowerCase().includes("hotel") || l.descripcion.toLowerCase().includes("finca") || l.descripcion.toLowerCase().includes("alojar");
    });
    if (lodgPlaces.length > 0) {
      return `${matchedIntro}Para descansar cómodamente y disfrutar del clima templado y el aire puro de Fusa, te recomiendo estos hospedajes disponibles en la app:\n\n` + 
        lodgPlaces.map(l => `🏨 **${l.nombre}**: ${l.descripcion} (${l.direccion || 'Fusagasugá'})`).join("\n\n");
    }
  }

  const featured = (lugares || []).slice(0, 3);
  const featuredList = featured.map(l => `✨ **${l.nombre}** (${l.direccion || 'Fusagasugá'})`).join("\n");
  
  return `${matchedIntro}¡Hola! Soy **Fusa Guía** 🚀. Actualmente mi módulo de inteligencia artificial de Gemini se encuentra en modo de contingencia local, ¡pero me sé de memoria toda la información de Fusagasugá!

Tenemos registrados **${lugares?.length || 0} maravillosos lugares** listos para explorar:
${featuredList}

Dime, ¿buscas algún restaurante, hotel, jardín o sitio turístico para ayudarte a ubicarlo en nuestro mapa interactivo de Fusagasugá? 🗺️🌸`;
}

app.get("/api/weather", async (req, res) => {
  const queryCity = req.query.q as string;

  // Si se solicita una ciudad específica
  if (queryCity && queryCity.trim()) {
    const cityName = queryCity.trim();
    
    const fallback = {
      temp: 20,
      apparentTemp: 21,
      humidity: 62,
      windSpeed: 11,
      isDay: true,
      code: 1,
      des: "Parcialmente Nublado ⛅",
      forecast: [
        { day: "Hoy", temp: 20, code: 1, des: "Medio nublado" },
        { day: "Mañ", temp: 21, code: 1, des: "Medio nublado" },
        { day: "Mar", temp: 19, code: 3, des: "Nublado" },
        { day: "Mié", temp: 20, code: 2, des: "Despejado" },
        { day: "Jue", temp: 22, code: 0, des: "Soleado" }
      ],
      region: "Colombia"
    };

    let resultData: any = null;

    // Intentar buscar geolocalización y clima real vía Open-Meteo
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData: any = await geoRes.json();
        if (geoData && geoData.results && geoData.results.length > 0) {
          const loc = geoData.results[0];
          const lat = loc.latitude;
          const lng = loc.longitude;
          const officialName = loc.name;
          const region = [loc.admin1, loc.country].filter(Boolean).join(", ");

          const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
          const fcRes = await fetch(forecastUrl);
          if (fcRes.ok) {
            const fcData: any = await fcRes.json();
            if (fcData && fcData.current) {
              const code = fcData.current.weather_code;
              let des = "Ligeramente Nublado";
              if (code === 0) des = "Cielo Despejado ☀️";
              else if (code >= 1 && code <= 3) des = "Parcialmente Nublado ⛅";
              else if (code >= 45 && code <= 48) des = "Niebla densa 🌫️";
              else if (code >= 51 && code <= 55) des = "Llovizna suave 🌧️";
              else if (code >= 61 && code <= 65) des = "Lluvia moderada ⛈️";
              else if (code >= 80 && code <= 82) des = "Chubascos de lluvia ☔";
              else if (code >= 95 && code <= 99) des = "Tormenta eléctrica ⚡";

              const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
              const todayIdx = new Date().getDay();
              const forecastList = [];
              for (let i = 0; i < 5; i++) {
                const forecastCode = fcData.daily.weather_code[i];
                let fDes = "Despejado";
                if (forecastCode === 0) fDes = "Mayormente sol";
                else if (forecastCode >= 1 && forecastCode <= 3) fDes = "Medio nublado";
                else if (forecastCode >= 51 && forecastCode <= 65) fDes = "Posibles lluvias";
                else if (forecastCode >= 80 && forecastCode <= 99) fDes = "Tormenta";
                else fDes = "Nublado";

                forecastList.push({
                  day: i === 0 ? "Hoy" : days[(todayIdx + i) % 7],
                  temp: Math.round(fcData.daily.temperature_2m_max[i]),
                  code: forecastCode,
                  des: fDes
                });
              }

              resultData = {
                temp: Math.round(fcData.current.temperature_2m),
                apparentTemp: Math.round(fcData.current.apparent_temperature),
                humidity: fcData.current.relative_humidity_2m,
                windSpeed: Math.round(fcData.current.wind_speed_10m),
                isDay: fcData.current.is_day === 1,
                code: code,
                des: des,
                forecast: forecastList,
                region: region,
                name: officialName
              };
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching live location weather:", err);
    }

    // Calibrar/Enriquecer con Gemini 3.5 con la herramienta de Google Search Grounding si la clave está disponible
    const hasApiKey = hasValidApiKey();
    if (hasApiKey) {
      try {
        const client = getGeminiClient();
        const geminiResponse = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Obtén el reporte del clima en tiempo real exacto y real del buscador de Google para la ubicación: "${cityName}". Extrae exactamente la temperatura actual en grados Celsius (°C), la sensación térmica, la humedad en %, la velocidad del viento en km/h, y una descripción amigable del cielo (como 'Cielo Despejado ☀️', 'Parcialmente Nublado ⛅', 'Llovizna suave 🌧️', 'Tormenta eléctrica ⚡', etc.). Devuelve exclusivamente un objeto JSON válido con los campos: temp (number), apparentTemp (number), humidity (number), windSpeed (number), des (string). No incluyas explicaciones ni bloques de código markdown.`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          }
        });

        const text = geminiResponse.text || "";
        let cleanText = text.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        }
        const calibration = JSON.parse(cleanText);

        if (calibration && typeof calibration.temp === 'number') {
          if (!resultData) {
            resultData = { ...fallback, ...calibration, name: cityName };
          } else {
            resultData.temp = calibration.temp;
            if (typeof calibration.apparentTemp === 'number') resultData.apparentTemp = calibration.apparentTemp;
            if (typeof calibration.humidity === 'number') resultData.humidity = calibration.humidity;
            if (typeof calibration.windSpeed === 'number') resultData.windSpeed = calibration.windSpeed;
            if (calibration.des) resultData.des = calibration.des;

            if (resultData.forecast && resultData.forecast[0]) {
              resultData.forecast[0].temp = calibration.temp;
              if (calibration.des) resultData.forecast[0].des = calibration.des;
            }
          }
        }
      } catch (err) {
        console.log("Info: Gemini weather search grounding skipped or failed:", err instanceof Error ? err.message : err);
      }
    }

    const finalResult = resultData || { ...fallback, name: cityName };
    return res.json(finalResult);
  }

  // Comportamiento original para el lote de ciudades fijas
  const cities = [
    { name: 'Fusagasugá', lat: 4.3361, lng: -74.3638 },
    { name: 'Bogotá', lat: 4.711, lng: -74.0721 },
    { name: 'Ibagué', lat: 4.4389, lng: -75.2322 },
    { name: 'Melgar', lat: 4.2045, lng: -74.6408 }
  ];

  const results: { [key: string]: any } = {};

  const fallbacks: { [key: string]: any } = {
    'Fusagasugá': {
      temp: 22,
      apparentTemp: 23,
      humidity: 68,
      windSpeed: 10,
      isDay: true,
      code: 2,
      des: "Parcialmente Nublado ⛅",
      forecast: [
        { day: "Hoy", temp: 23, code: 1, des: "Chubascos" },
        { day: "Mañ", temp: 24, code: 0, des: "Soleado" },
        { day: "Mar", temp: 22, code: 3, des: "Nublado" },
        { day: "Mié", temp: 21, code: 51, des: "Llovizna" },
        { day: "Jue", temp: 23, code: 2, des: "Despejado" }
      ]
    },
    'Bogotá': {
      temp: 15,
      apparentTemp: 14,
      humidity: 75,
      windSpeed: 12,
      isDay: true,
      code: 3,
      des: "Llovizna suave 🌧️",
      forecast: [
        { day: "Hoy", temp: 15, code: 3, des: "Llovizna" },
        { day: "Mañ", temp: 16, code: 51, des: "Lluvia" },
        { day: "Mar", temp: 14, code: 3, des: "Nublado" },
        { day: "Mié", temp: 15, code: 2, des: "Nublado" },
        { day: "Jue", temp: 16, code: 1, des: "Despejado" }
      ]
    },
    'Ibagué': {
      temp: 26,
      apparentTemp: 27,
      humidity: 62,
      windSpeed: 8,
      isDay: true,
      code: 1,
      des: "Parcialmente Nublado ⛅",
      forecast: [
        { day: "Hoy", temp: 26, code: 1, des: "Chubascos" },
        { day: "Mañ", temp: 27, code: 0, des: "Soleado" },
        { day: "Mar", temp: 28, code: 1, des: "Soleado" },
        { day: "Mié", temp: 25, code: 3, des: "Nublado" },
        { day: "Jue", temp: 27, code: 2, des: "Medio nublado" }
      ]
    },
    'Melgar': {
      temp: 31,
      apparentTemp: 34,
      humidity: 55,
      windSpeed: 6,
      isDay: true,
      code: 0,
      des: "Cielo Despejado ☀️",
      forecast: [
        { day: "Hoy", temp: 31, code: 0, des: "Soleado" },
        { day: "Mañ", temp: 32, code: 0, des: "Soleado" },
        { day: "Mar", temp: 33, code: 1, des: "Soleado" },
        { day: "Mié", temp: 30, code: 51, des: "Lluvioso" },
        { day: "Jue", temp: 32, code: 0, des: "Soleado" }
      ]
    }
  };

  try {
    await Promise.all(
      cities.map(async (city) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Bogota`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (!response.ok) {
            results[city.name] = fallbacks[city.name];
            return;
          }

          const data: any = await response.json();
          if (data && data.current) {
            const code = data.current.weather_code;
            let des = "Ligeramente Nublado";
            if (code === 0) des = "Cielo Despejado ☀️";
            else if (code >= 1 && code <= 3) des = "Parcialmente Nublado ⛅";
            else if (code >= 45 && code <= 48) des = "Niebla densa 🌫️";
            else if (code >= 51 && code <= 55) des = "Llovizna suave 🌧️";
            else if (code >= 61 && code <= 65) des = "Lluvia moderada ⛈️";
            else if (code >= 80 && code <= 82) des = "Chubascos de lluvia ☔";
            else if (code >= 95 && code <= 99) des = "Tormenta eléctrica ⚡";

            const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            const todayIdx = new Date().getDay();
            const forecastList = [];
            for (let i = 0; i < 5; i++) {
              const forecastCode = data.daily.weather_code[i];
              let fDes = "Despejado";
              if (forecastCode === 0) fDes = "Mayormente sol";
              else if (forecastCode >= 1 && forecastCode <= 3) fDes = "Medio nublado";
              else if (forecastCode >= 51 && forecastCode <= 65) fDes = "Posibles lluvias";
              else if (forecastCode >= 80 && forecastCode <= 99) fDes = "Tormenta";
              else fDes = "Nublado";

              forecastList.push({
                day: i === 0 ? "Hoy" : days[(todayIdx + i) % 7],
                temp: Math.round(data.daily.temperature_2m_max[i]),
                code: forecastCode,
                des: fDes
              });
            }

            results[city.name] = {
              temp: Math.round(data.current.temperature_2m),
              apparentTemp: Math.round(data.current.apparent_temperature),
              humidity: data.current.relative_humidity_2m,
              windSpeed: Math.round(data.current.wind_speed_10m),
              isDay: data.current.is_day === 1,
              code: code,
              des: des,
              forecast: forecastList
            };
          } else {
            results[city.name] = fallbacks[city.name];
          }
        } catch (err) {
          results[city.name] = fallbacks[city.name];
        }
      })
    );
  } catch (err) {}

  for (const city of cities) {
    if (!results[city.name]) {
      results[city.name] = fallbacks[city.name];
    }
  }

  const hasApiKey = hasValidApiKey();

  if (hasApiKey) {
    try {
      const client = getGeminiClient();
      const geminiResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Obtén la temperatura actual exacta en tiempo real en grados Celsius, la sensación térmica, el porcentaje de humedad, la velocidad del viento en km/h y una descripción corta del estado del cielo (como 'Cielo Despejado ☀️', 'Parcialmente Nublado ⛅', 'Llovizna suave 🌧️', 'Tormenta eléctrica ⚡', etc.) para las siguientes ciudades de Colombia en este mismo instante: Fusagasugá, Bogotá, Ibagué y Melgar. Devuelve exclusivamente un objeto JSON válido con la información calibrada. No incluyas explicaciones ni bloques de código markdown.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }
      });

      const text = geminiResponse.text || "";
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      }
      const calibration = JSON.parse(cleanText);

      for (const cityName of Object.keys(calibration)) {
        if (results[cityName]) {
          const data = calibration[cityName];
          if (data && typeof data.temp === 'number') {
            results[cityName].temp = data.temp;
            if (typeof data.apparentTemp === 'number') results[cityName].apparentTemp = data.apparentTemp;
            if (typeof data.humidity === 'number') results[cityName].humidity = data.humidity;
            if (typeof data.windSpeed === 'number') results[cityName].windSpeed = data.windSpeed;
            if (data.des) results[cityName].des = data.des;

            if (results[cityName].forecast && results[cityName].forecast[0]) {
              results[cityName].forecast[0].temp = data.temp;
              if (data.des) results[cityName].forecast[0].des = data.des;
            }
          }
        }
      }
    } catch (err) {
      console.log("Info: Weather calibration with Gemini was skipped or fell back to Open-Meteo. Details:", err instanceof Error ? err.message : err);
    }
  }

  return res.json(results);
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatHistory, lugares, categorias } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    const hasApiKey = hasValidApiKey();

    if (hasApiKey) {
      try {
        const client = getGeminiClient();
        
        const placesContext = (lugares || []).map((l: any) => {
          const cat = (categorias || []).find((c: any) => c.id === l.categoriaId);
          return `- **${l.nombre}**: ${l.descripcion || 'Lugar increíble en Fusagasugá.'} (Categoría: ${cat ? cat.nombre : 'General'}, Dirección: ${l.direccion || 'Escríbenos para saber más'}, Calificación: ⭐${l.puntuacion || 'N/A'})`;
        }).join("\n");

        const fullSystemInstruction = `${systemInstruction}\n\nINFORMACIÓN ACTUAL DE LA APLICACIÓN Fusa Explor (Usa estos lugares para tus recomendaciones):\n${placesContext}`;

        const formattedHistory = (chatHistory || []).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const chat = client.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: fullSystemInstruction,
          },
          history: formattedHistory
        });

        const result = await chat.sendMessage({ message: message });
        return res.json({ response: result.text });
      } catch (geminiError: any) {
        console.warn("Gemini API execution failed, falling back to local heuristic matching engine... Error:", geminiError);
        const heuristicText = getLocalHeuristicResponse(message, lugares, categorias);
        return res.json({ response: heuristicText });
      }
    } else {
      const heuristicText = getLocalHeuristicResponse(message, lugares, categorias);
      return res.json({ response: heuristicText });
    }

  } catch (error: any) {
    console.error("Error in assistant API:", error);
    res.status(500).json({ error: "Surgió un inconveniente en el canal de Fusa Guía.", details: error.message });
  }
});

app.post("/api/moderar", async (req, res) => {
  try {
    const { texto, imagenBase64 } = req.body;
    const result = await moderarContenidoTuristico(texto || "", imagenBase64);
    return res.json(result);
  } catch (error: any) {
    console.error("Error en endpoint de moderación:", error);
    return res.json({
      aprobado: true,
      categoriaInfraccion: "ninguno",
      motivo: "Aprobado por contingencia técnica."
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
