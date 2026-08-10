import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface GeocodedCity {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  label: string;
  icon: LucideIcon;
}

export interface DailyForecast {
  date: string;
  max: number;
  min: number;
  code: number;
}

export interface WeatherData {
  currentTemp: number;
  currentCode: number;
  daily: DailyForecast[];
}

// Códigos WMO usados pela Open-Meteo (https://open-meteo.com/en/docs).
const WEATHER_CONDITIONS: Record<number, WeatherCondition> = {
  0: { label: "Céu limpo", icon: Sun },
  1: { label: "Poucas nuvens", icon: CloudSun },
  2: { label: "Parcialmente nublado", icon: CloudSun },
  3: { label: "Nublado", icon: Cloud },
  45: { label: "Neblina", icon: CloudFog },
  48: { label: "Neblina densa", icon: CloudFog },
  51: { label: "Garoa fraca", icon: CloudDrizzle },
  53: { label: "Garoa", icon: CloudDrizzle },
  55: { label: "Garoa forte", icon: CloudDrizzle },
  56: { label: "Garoa congelante", icon: CloudDrizzle },
  57: { label: "Garoa congelante forte", icon: CloudDrizzle },
  61: { label: "Chuva fraca", icon: CloudRain },
  63: { label: "Chuva", icon: CloudRain },
  65: { label: "Chuva forte", icon: CloudRain },
  66: { label: "Chuva congelante", icon: CloudRain },
  67: { label: "Chuva congelante forte", icon: CloudRain },
  71: { label: "Neve fraca", icon: CloudSnow },
  73: { label: "Neve", icon: CloudSnow },
  75: { label: "Neve forte", icon: CloudSnow },
  77: { label: "Grãos de neve", icon: CloudSnow },
  80: { label: "Pancadas de chuva fracas", icon: CloudRain },
  81: { label: "Pancadas de chuva", icon: CloudRain },
  82: { label: "Pancadas de chuva fortes", icon: CloudRain },
  85: { label: "Pancadas de neve fracas", icon: CloudSnow },
  86: { label: "Pancadas de neve fortes", icon: CloudSnow },
  95: { label: "Trovoada", icon: CloudLightning },
  96: { label: "Trovoada com granizo", icon: CloudLightning },
  99: { label: "Trovoada forte com granizo", icon: CloudLightning },
};

export function getWeatherCondition(code: number): WeatherCondition {
  return WEATHER_CONDITIONS[code] ?? { label: "Tempo indefinido", icon: Cloud };
}

export async function geocodeCity(query: string): Promise<GeocodedCity | null> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Não foi possível buscar a cidade.");
  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) return null;
  return {
    name: result.admin1 ? `${result.name}, ${result.admin1}` : result.name,
    country: result.country ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&forecast_days=4&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Não foi possível obter a previsão do tempo.");
  const data = await res.json();

  const daily: DailyForecast[] = (data.daily?.time ?? []).map(
    (date: string, i: number) => ({
      date,
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      code: data.daily.weather_code[i],
    })
  );

  return {
    currentTemp: Math.round(data.current?.temperature_2m ?? 0),
    currentCode: data.current?.weather_code ?? 0,
    daily,
  };
}
