// Open-Meteo API client for weather data
// Free API, no key required
// Nishihara Village, Kumamoto: 32.8447, 130.9147

export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
  };
  daily: WeatherDay[];
}

const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "晴れ", icon: "☀️" },
  1: { label: "晴れ", icon: "🌤️" },
  2: { label: "くもり", icon: "⛅" },
  3: { label: "くもり", icon: "☁️" },
  45: { label: "霧", icon: "🌫️" },
  48: { label: "霧", icon: "🌫️" },
  51: { label: "小雨", icon: "🌧️" },
  53: { label: "雨", icon: "🌧️" },
  55: { label: "雨", icon: "🌧️" },
  61: { label: "雨", icon: "🌧️" },
  63: { label: "雨", icon: "🌧️" },
  65: { label: "大雨", icon: "⛈️" },
  71: { label: "雪", icon: "🌨️" },
  73: { label: "雪", icon: "🌨️" },
  75: { label: "大雪", icon: "❄️" },
  80: { label: "にわか雨", icon: "🌦️" },
  81: { label: "にわか雨", icon: "🌦️" },
  82: { label: "にわか雨", icon: "🌦️" },
  95: { label: "雷雨", icon: "⛈️" },
  96: { label: "雷雨", icon: "⛈️" },
  99: { label: "雷雨", icon: "⛈️" },
};

export function getWeatherInfo(code: number) {
  return WEATHER_CODES[code] || { label: "不明", icon: "❓" };
}

export async function fetchWeather(
  lat: number = 32.8447,
  lon: number = 130.9147
): Promise<WeatherData | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
    );
    url.searchParams.set("timezone", "Asia/Tokyo");
    url.searchParams.set("forecast_days", "7");

    const response = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error("Weather fetch failed");

    const data = await response.json();

    return {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
      },
      daily: data.daily.time.map((date: string, i: number) => ({
        date,
        weatherCode: data.daily.weather_code[i],
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipitation: data.daily.precipitation_sum[i],
        windSpeed: Math.round(data.daily.wind_speed_10m_max[i]),
      })),
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

export function isGoodFarmingDay(day: WeatherDay): boolean {
  // Good for farming: no rain, not too windy
  const noRain = day.precipitation < 1;
  const notWindy = day.windSpeed < 30;
  const goodWeather = [0, 1, 2].includes(day.weatherCode);
  return noRain && notWindy && goodWeather;
}
