"use client";

import { useEffect, useState } from "react";
import { fetchWeather, getWeatherInfo, isGoodFarmingDay, WeatherData } from "@/lib/weather";
import { Droplets, Wind, Leaf } from "lucide-react";

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchWeather();
      setWeather(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const today = weather.daily[0];
  const currentInfo = getWeatherInfo(weather.current.weatherCode);
  const isGoodDay = isGoodFarmingDay(today);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Current Weather */}
      <div className="p-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white flex flex-col items-center text-center">
        <div className="bg-white/20 p-2 rounded-full mb-3">
            <span className="text-4xl">{currentInfo.icon}</span>
        </div>
        
        <div>
          <p className="text-sm opacity-90 font-medium tracking-wide">西原村</p>
          <div className="flex items-center justify-center gap-2 mt-1 mb-2">
            <span className="text-5xl font-bold tracking-tighter ml-2">{weather.current.temperature}°</span>
          </div>
          <span className="text-lg font-medium bg-white/10 px-3 py-0.5 rounded-full">{currentInfo.label}</span>
        </div>
        
        <div className="flex gap-4 mt-6 text-sm font-medium opacity-90 bg-black/10 px-4 py-2 rounded-xl">
          <span className="flex items-center gap-1.5">
            <Wind className="w-4 h-4" />
            {weather.current.windSpeed}km/h
          </span>
          <div className="w-px h-4 bg-white/30"></div>
          <span className="flex items-center gap-1.5">
            <span className="text-red-100">↑{today.tempMax}°</span>
            <span className="text-blue-100">↓{today.tempMin}°</span>
          </span>
        </div>

        {isGoodDay && (
          <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
            <Leaf className="w-4 h-4" />
            <span className="text-sm font-medium">農作業日和です！</span>
          </div>
        )}
      </div>

      {/* 7 Day Forecast */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">7日間の天気</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weather.daily.slice(1).map((day, i) => {
            const info = getWeatherInfo(day.weatherCode);
            const isGood = isGoodFarmingDay(day);
            const date = new Date(day.date);
            const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
            
            return (
              <div
                key={day.date}
                className={`flex-shrink-0 w-16 text-center p-3 rounded-xl ${
                  isGood ? "bg-green-50 border border-green-200" : "bg-gray-50"
                }`}
              >
                <p className="text-xs text-gray-500">{date.getDate()}日</p>
                <p className="text-xs font-medium text-gray-600">{weekday}</p>
                <p className="text-2xl my-1">{info.icon}</p>
                <p className="text-xs">
                  <span className="text-red-500">{day.tempMax}°</span>
                  <span className="text-gray-400 mx-0.5">/</span>
                  <span className="text-blue-500">{day.tempMin}°</span>
                </p>
                {day.precipitation > 0 && (
                  <p className="text-xs text-blue-500 flex items-center justify-center gap-0.5 mt-1">
                    <Droplets className="w-3 h-3" />
                    {day.precipitation}mm
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
