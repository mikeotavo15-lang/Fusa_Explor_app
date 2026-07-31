export function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Cielo Despejado ☀️";
  if (code >= 1 && code <= 3) return "Parcialmente Nublado ⛅";
  if (code >= 45 && code <= 48) return "Niebla densa 🌫️";
  if (code >= 51 && code <= 55) return "Llovizna suave 🌧️";
  if (code >= 61 && code <= 65) return "Lluvia moderada ⛈️";
  if (code >= 80 && code <= 82) return "Chubascos de lluvia ☔";
  if (code >= 95 && code <= 99) return "Tormenta eléctrica ⚡";
  return "Ligeramente Nublado";
}

export function forecastCodeToDescription(code: number): string {
  if (code === 0) return "Mayormente sol";
  if (code >= 1 && code <= 3) return "Medio nublado";
  if (code >= 51 && code <= 65) return "Posibles lluvias";
  if (code >= 80 && code <= 99) return "Tormenta";
  return "Nublado";
}

export const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const FIXED_CITIES = [
  { name: "Fusagasugá", lat: 4.3361, lng: -74.3638 },
  { name: "Bogotá", lat: 4.711, lng: -74.0721 },
  { name: "Ibagué", lat: 4.4389, lng: -75.2322 },
  { name: "Melgar", lat: 4.2045, lng: -74.6408 },
];

export const SINGLE_CITY_FALLBACK = {
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
    { day: "Jue", temp: 22, code: 0, des: "Soleado" },
  ],
  region: "Colombia",
};

export const FIXED_CITIES_FALLBACK: { [key: string]: any } = {
  Fusagasugá: {
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
      { day: "Jue", temp: 23, code: 2, des: "Despejado" },
    ],
  },
  Bogotá: {
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
      { day: "Jue", temp: 16, code: 1, des: "Despejado" },
    ],
  },
  Ibagué: {
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
      { day: "Jue", temp: 27, code: 2, des: "Medio nublado" },
    ],
  },
  Melgar: {
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
      { day: "Jue", temp: 32, code: 0, des: "Soleado" },
    ],
  },
};
