import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGeminiClient, hasValidApiKey } from "./_lib/gemini";
import {
  DAYS,
  FIXED_CITIES,
  FIXED_CITIES_FALLBACK,
  SINGLE_CITY_FALLBACK,
  forecastCodeToDescription,
  weatherCodeToDescription,
} from "./_lib/weather-data";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const queryCity = (req.query.q as string) || "";

  // --- Caso 1: se pidió una ciudad específica (?q=nombre) ---
  if (queryCity && queryCity.trim()) {
    const cityName = queryCity.trim();
    let resultData: any = null;

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=es`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData: any = await geoRes.json();
        if (geoData?.results?.length > 0) {
          const loc = geoData.results[0];
          const lat = loc.latitude;
          const lng = loc.longitude;
          const officialName = loc.name;
          const region = [loc.admin1, loc.country].filter(Boolean).join(", ");

          const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
          const fcRes = await fetch(forecastUrl);
          if (fcRes.ok) {
            const fcData: any = await fcRes.json();
            if (fcData?.current) {
              const code = fcData.current.weather_code;
              const des = weatherCodeToDescription(code);

              const todayIdx = new Date().getDay();
              const forecastList = [];
              for (let i = 0; i < 5; i++) {
                const forecastCode = fcData.daily.weather_code[i];
                forecastList.push({
                  day: i === 0 ? "Hoy" : DAYS[(todayIdx + i) % 7],
                  temp: Math.round(fcData.daily.temperature_2m_max[i]),
                  code: forecastCode,
                  des: forecastCodeToDescription(forecastCode),
                });
              }

              resultData = {
                temp: Math.round(fcData.current.temperature_2m),
                apparentTemp: Math.round(fcData.current.apparent_temperature),
                humidity: fcData.current.relative_humidity_2m,
                windSpeed: Math.round(fcData.current.wind_speed_10m),
                isDay: fcData.current.is_day === 1,
                code,
                des,
                forecast: forecastList,
                region,
                name: officialName,
              };
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching live location weather:", err);
    }

    if (hasValidApiKey()) {
      try {
        const client = getGeminiClient();
        const geminiResponse = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Obtén el reporte del clima en tiempo real exacto y real del buscador de Google para la ubicación: "${cityName}". Extrae exactamente la temperatura actual en grados Celsius (°C), la sensación térmica, la humedad en %, la velocidad del viento en km/h, y una descripción amigable del cielo (como 'Cielo Despejado ☀️', 'Parcialmente Nublado ⛅', 'Llovizna suave 🌧️', 'Tormenta eléctrica ⚡', etc.). Devuelve exclusivamente un objeto JSON válido con los campos: temp (number), apparentTemp (number), humidity (number), windSpeed (number), des (string). No incluyas explicaciones ni bloques de código markdown.`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          },
        });

        const text = geminiResponse.text || "";
        let cleanText = text.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        }
        const calibration = JSON.parse(cleanText);

        if (calibration && typeof calibration.temp === "number") {
          if (!resultData) {
            resultData = { ...SINGLE_CITY_FALLBACK, ...calibration, name: cityName };
          } else {
            resultData.temp = calibration.temp;
            if (typeof calibration.apparentTemp === "number")
              resultData.apparentTemp = calibration.apparentTemp;
            if (typeof calibration.humidity === "number") resultData.humidity = calibration.humidity;
            if (typeof calibration.windSpeed === "number") resultData.windSpeed = calibration.windSpeed;
            if (calibration.des) resultData.des = calibration.des;

            if (resultData.forecast?.[0]) {
              resultData.forecast[0].temp = calibration.temp;
              if (calibration.des) resultData.forecast[0].des = calibration.des;
            }
          }
        }
      } catch (err) {
        console.log(
          "Info: Gemini weather search grounding skipped or failed:",
          err instanceof Error ? err.message : err
        );
      }
    }

    const finalResult = resultData || { ...SINGLE_CITY_FALLBACK, name: cityName };
    return res.status(200).json(finalResult);
  }

  // --- Caso 2: comportamiento original para el lote de ciudades fijas ---
  const results: { [key: string]: any } = {};

  try {
    await Promise.all(
      FIXED_CITIES.map(async (city) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Bogota`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (!response.ok) {
            results[city.name] = FIXED_CITIES_FALLBACK[city.name];
            return;
          }

          const data: any = await response.json();
          if (data?.current) {
            const code = data.current.weather_code;
            const des = weatherCodeToDescription(code);

            const todayIdx = new Date().getDay();
            const forecastList = [];
            for (let i = 0; i < 5; i++) {
              const forecastCode = data.daily.weather_code[i];
              forecastList.push({
                day: i === 0 ? "Hoy" : DAYS[(todayIdx + i) % 7],
                temp: Math.round(data.daily.temperature_2m_max[i]),
                code: forecastCode,
                des: forecastCodeToDescription(forecastCode),
              });
            }

            results[city.name] = {
              temp: Math.round(data.current.temperature_2m),
              apparentTemp: Math.round(data.current.apparent_temperature),
              humidity: data.current.relative_humidity_2m,
              windSpeed: Math.round(data.current.wind_speed_10m),
              isDay: data.current.is_day === 1,
              code,
              des,
              forecast: forecastList,
            };
          } else {
            results[city.name] = FIXED_CITIES_FALLBACK[city.name];
          }
        } catch (err) {
          results[city.name] = FIXED_CITIES_FALLBACK[city.name];
        }
      })
    );
  } catch (err) {
    // noop: se rellena con fallback abajo
  }

  for (const city of FIXED_CITIES) {
    if (!results[city.name]) {
      results[city.name] = FIXED_CITIES_FALLBACK[city.name];
    }
  }

  if (hasValidApiKey()) {
    try {
      const client = getGeminiClient();
      const geminiResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
          "Obtén la temperatura actual exacta en tiempo real en grados Celsius, la sensación térmica, el porcentaje de humedad, la velocidad del viento en km/h y una descripción corta del estado del cielo (como 'Cielo Despejado ☀️', 'Parcialmente Nublado ⛅', 'Llovizna suave 🌧️', 'Tormenta eléctrica ⚡', etc.) para las siguientes ciudades de Colombia en este mismo instante: Fusagasugá, Bogotá, Ibagué y Melgar. Devuelve exclusivamente un objeto JSON válido con la información calibrada. No incluyas explicaciones ni bloques de código markdown.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
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
          if (data && typeof data.temp === "number") {
            results[cityName].temp = data.temp;
            if (typeof data.apparentTemp === "number") results[cityName].apparentTemp = data.apparentTemp;
            if (typeof data.humidity === "number") results[cityName].humidity = data.humidity;
            if (typeof data.windSpeed === "number") results[cityName].windSpeed = data.windSpeed;
            if (data.des) results[cityName].des = data.des;

            if (results[cityName].forecast?.[0]) {
              results[cityName].forecast[0].temp = data.temp;
              if (data.des) results[cityName].forecast[0].des = data.des;
            }
          }
        }
      }
    } catch (err) {
      console.log(
        "Info: Weather calibration with Gemini was skipped or fell back to Open-Meteo. Details:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return res.status(200).json(results);
}
