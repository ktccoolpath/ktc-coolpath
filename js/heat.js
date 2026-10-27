// =============================================================
// KTC CoolPath – heat alert logic (Week 2: planned + prototyped)
// Weather source: Open-Meteo (free, no API key)  https://open-meteo.com/en/docs
//
// The alert level is decided from the "feels-like" (apparent) temperature,
// using the NOAA heat-index danger bands (converted to °C):
//   below 27 °C  -> Normal
//   27 – 32 °C   -> Caution
//   32 – 41 °C   -> Extreme caution
//   41 – 54 °C   -> Danger
//   54 °C and up -> Extreme danger
// A very high UV index (8+) adds an extra sun warning.
// Full explanation: docs/heat-alert-logic.md
// =============================================================

(function () {
  "use strict";

  const LEVELS = [
    { id: "normal",   min: -Infinity, label: "Normal",          color: "#2e7d32",
      advice: "Walking outside is OK. Carry water." },
    { id: "caution",  min: 27, label: "Caution",                color: "#9e9d24",
      advice: "Take the shaded route if it is not much longer. Drink water." },
    { id: "extreme-caution", min: 32, label: "Extreme caution", color: "#ef6c00",
      advice: "Prefer the shaded / indoor route. Stop at a water point on the way." },
    { id: "danger",   min: 41, label: "Danger",                 color: "#c62828",
      advice: "Use indoor corridors where possible. Keep outdoor walking short." },
    { id: "extreme",  min: 54, label: "Extreme danger",         color: "#6a1b9a",
      advice: "Avoid walking outside. Wait indoors or ask staff for help." }
  ];

  const CACHE_KEY = "coolpath-weather";
  const CACHE_MINUTES = 15;

  // Pure function: weather numbers in -> alert out (easy to test)
  function classify(apparentTempC, uvIndex) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (apparentTempC >= l.min) level = l;
    }
    const uvWarning = typeof uvIndex === "number" && uvIndex >= 8
      ? "UV is very high – cover your head and avoid direct sun."
      : "";
    return { ...level, uvWarning };
  }

  function buildUrl(lat, lng) {
    const p = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,uv_index,is_day",
      timezone: "Asia/Kuwait"
    });
    return "https://api.open-meteo.com/v1/forecast?" + p.toString();
  }

  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.savedAt < CACHE_MINUTES * 60 * 1000) return c.data;
    } catch (e) { /* storage blocked – ignore */ }
    return null;
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); }
    catch (e) { /* ignore */ }
  }

  // Fetch current weather; uses a 15-minute cache so we don't call the API on every page load
  async function fetchWeather(lat, lng) {
    const cached = readCache();
    if (cached) return { ...cached, fromCache: true };

    const res = await fetch(buildUrl(lat, lng));
    if (!res.ok) throw new Error("Open-Meteo error " + res.status);
    const json = await res.json();
    const c = json.current;
    const data = {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      uv: c.uv_index,
      isDay: c.is_day === 1
    };
    writeCache(data);
    return data;
  }

  // Draw the alert banner into an element
  function render(el, weather) {
    const a = classify(weather.feelsLike, weather.uv);
    el.style.borderLeft = `6px solid ${a.color}`;
    el.innerHTML = `
      <div class="heat-level" style="color:${a.color}">${a.label}</div>
      <div class="heat-numbers">
        ${Math.round(weather.temperature)}°C · feels like ${Math.round(weather.feelsLike)}°C ·
        humidity ${Math.round(weather.humidity)}% · UV ${weather.uv ?? "–"}
      </div>
      <div class="heat-advice">${a.advice}</div>
      ${a.uvWarning ? `<div class="heat-advice">☀ ${a.uvWarning}</div>` : ""}
      <div class="heat-source">Weather: Open-Meteo · updated ${weather.time}${weather.fromCache ? " (cached)" : ""}</div>`;
    return a;
  }

  function renderOffline(el) {
    el.style.borderLeft = "6px solid #757575";
    el.innerHTML = `<div class="heat-level">Weather unavailable</div>
      <div class="heat-advice">We could not get the weather. If it is hot outside, choose the shaded route and carry water.</div>`;
  }

  window.CoolPathHeat = { LEVELS, classify, buildUrl, fetchWeather, render, renderOffline };
})();
