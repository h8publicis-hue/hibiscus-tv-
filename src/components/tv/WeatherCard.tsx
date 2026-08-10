"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CloudOff } from "lucide-react";
import { fetchWeather, getWeatherCondition, type WeatherData } from "@/lib/weather";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

// new Date("2026-08-10") é interpretado como UTC 00:00, o que "volta" um
// dia em fusos negativos (Brasil). Construindo a partir dos componentes
// year/month/day, o Date fica ancorado no fuso local corretamente.
function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

interface WeatherCardProps {
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function WeatherCard({ cidade, latitude, longitude }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    setFailed(false);

    function load() {
      fetchWeather(latitude as number, longitude as number)
        .then((data) => {
          if (!cancelled) setWeather(data);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [latitude, longitude]);

  if (failed || latitude == null || longitude == null) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-navy-800 via-tropical-800 to-tropical-950 text-white">
        <CloudOff className="h-14 w-14 text-white/60" />
        <p className="text-lg text-white/80">
          Não foi possível carregar a previsão do tempo.
        </p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 via-tropical-800 to-tropical-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  const current = getWeatherCondition(weather.currentCode);
  const CurrentIcon = current.icon;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-gradient-to-br from-navy-800 via-tropical-800 to-tropical-950 px-16 text-white">
      <div className="text-center">
        <p className="text-2xl font-medium text-white/80">{cidade}</p>
        <p className="mt-1 text-sm uppercase tracking-[0.3em] text-white/50">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="flex items-center gap-8">
        <CurrentIcon className="h-28 w-28" strokeWidth={1.5} />
        <div>
          <p className="text-8xl font-bold leading-none">
            {weather.currentTemp}°
          </p>
          <p className="mt-2 text-xl text-white/80">{current.label}</p>
        </div>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-4 gap-4">
        {weather.daily.map((day) => {
          const condition = getWeatherCondition(day.code);
          const DayIcon = condition.icon;
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-3 py-5"
            >
              <p className="text-sm font-medium uppercase text-white/70">
                {format(parseLocalDate(day.date), "EEE", { locale: ptBR })}
              </p>
              <DayIcon className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-base">
                <span className="font-semibold">{day.max}°</span>{" "}
                <span className="text-white/60">{day.min}°</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
