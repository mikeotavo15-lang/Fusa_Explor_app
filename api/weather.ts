import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DAYS,
  FIXED_CITIES,
  FIXED_CITIES_FALLBACK,
  SINGLE_CITY_FALLBACK,
  forecastCodeToDescription,
  weatherCodeToDescription,
} from "./_lib/weather-data.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const queryCity = (req.query.q as string) || "";

  if (queryCity && queryCity.trim()) {
    const cityName = queryCity.trim();
    let resultData: any = null;

    try {

      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search` +
        `?name=${encodeURIComponent(cityName)}` +
        `&count=1` +
        `&language=es` +
        `&format=json`;

      const geoRes = await fetch(geoUrl);

      if (geoRes.ok) {
        const geoData: any = await geoRes.json();

        if (geoData?.results?.length > 0) {
          const loc = geoData.results[0];

          const lat = loc.latitude;
          const lng = loc.longitude;
          const officialName = loc.name;

          const region = [loc.admin1, loc.country]
            .filter(Boolean)
            .join(", ");

          const forecastUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lng}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
            `&timezone=auto`;

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
                  temp: Math.round(
                    fcData.daily.temperature_2m_max[i]
                  ),
                  code: forecastCode,
                  des: weatherCodeToDescription(forecastCode),
                });
              }

              resultData = {
                temp: Math.round(fcData.current.temperature_2m),

                apparentTemp: Math.round(
                  fcData.current.apparent_temperature
                ),

                humidity: fcData.current.relative_humidity_2m,

                windSpeed: Math.round(
                  fcData.current.wind_speed_10m
                ),

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
      console.error(
        "Error fetching Open-Meteo weather:",
        err
      );
    }

    const finalResult =
      resultData || {
        ...SINGLE_CITY_FALLBACK,
        name: cityName,
      };

    return res.status(200).json(finalResult);
  }

  const results: { [key: string]: any } = {};

  try {
    await Promise.all(
      FIXED_CITIES.map(async (city) => {
        try {
          const controller = new AbortController();

          const timeoutId = setTimeout(
            () => controller.abort(),
            5000
          );

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${city.lat}` +
              `&longitude=${city.lng}` +
              `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
              `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
              `&timezone=America/Bogota`,
            {
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            results[city.name] =
              FIXED_CITIES_FALLBACK[city.name];

            return;
          }

          const data: any = await response.json();

          if (data?.current) {
            const code = data.current.weather_code;
            const des = weatherCodeToDescription(code);

            const todayIdx = new Date().getDay();

            const forecastList = [];

            for (let i = 0; i < 5; i++) {
              const forecastCode =
                data.daily.weather_code[i];

              forecastList.push({
                day:
                  i === 0
                    ? "Hoy"
                    : DAYS[(todayIdx + i) % 7],

                temp: Math.round(
                  data.daily.temperature_2m_max[i]
                ),

                code: forecastCode,

                des:
                  weatherCodeToDescription(
                    forecastCode
                  ),
              });
            }

            results[city.name] = {
              temp: Math.round(
                data.current.temperature_2m
              ),

              apparentTemp: Math.round(
                data.current.apparent_temperature
              ),

              humidity:
                data.current.relative_humidity_2m,

              windSpeed: Math.round(
                data.current.wind_speed_10m
              ),

              isDay:
                data.current.is_day === 1,

              code,

              des,

              forecast: forecastList,
            };
          } else {
            results[city.name] =
              FIXED_CITIES_FALLBACK[city.name];
          }
        } catch (err) {
          console.error(
            `Error obteniendo clima de ${city.name}:`,
            err
          );

          results[city.name] =
            FIXED_CITIES_FALLBACK[city.name];
        }
      })
    );
  } catch (err) {
    console.error(
      "Error general en Open-Meteo:",
      err
    );
  }

  for (const city of FIXED_CITIES) {
    if (!results[city.name]) {
      results[city.name] =
        FIXED_CITIES_FALLBACK[city.name];
    }
  }

  return res.status(200).json(results);
}