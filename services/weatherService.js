const logger = require("../utils/logger");
const { weatherCache } = require("../utils/caches");

const FETCH_TIMEOUT_MS = 5000;

const fetchWithTimeout = async (url, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const getWeatherForCity = async (city) => {
  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  try {
    const geo = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`,
    );
    const geoData = await geo.json();

    if (!geoData.results || geoData.results.length === 0) {
      const err = new Error(`City "${city}" not found`);
      err.status = 404;
      throw err;
    }
    const place = geoData.results[0];

    const weather = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`,
    );
    const weatherData = await weather.json();

    if (!weatherData.current || weatherData.current.temperature_2m === undefined) {
      logger.error("Weather data missing current field:", JSON.stringify(weatherData));
      const err = new Error("Weather data unavailable");
      err.status = 502;
      throw err;
    }

    const result = {
      city: place.name,
      country: place.country,
      temperature: weatherData.current.temperature_2m,
      weather_code: weatherData.current.weather_code,
    };

    try {
      weatherCache.set(cacheKey, result);
    } catch (error) {
      logger.warn("Weather cache full, skipping cache set", error.message);
    }

    return result;
  } catch (error) {
    if (error.status) throw error;
    if (error.name === "AbortError") {
      const err = new Error("Weather service timed out");
      err.status = 504;
      throw err;
    }
    logger.error("Weather error:", error.message);
    const err = new Error("Failed to fetch weather data");
    err.status = 500;
    throw err;
  }
};

module.exports = { getWeatherForCity };
