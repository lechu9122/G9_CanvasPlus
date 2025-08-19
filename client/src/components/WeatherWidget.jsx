// Ip fetching, weather getting, power munching ahh function
import React, { useEffect, useState } from "react";
// why must the weather codes be like this...
const WMO = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle (light)",
    57: "Freezing drizzle (dense)",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain (light)",
    67: "Freezing rain (heavy)",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers (slight)",
    81: "Rain showers (moderate)",
    82: "Rain showers (violent)",
    85: "Snow showers (slight)",
    86: "Snow showers (heavy)",
    95: "Thunderstorm",
    96: "Thunderstorm (slight hail)",
    99: "Thunderstorm (heavy hail)",
};
const THE_CORRECT_UNIT = "°C";

export default function WeatherWidget() {
    const [state, setState] = useState({ loaded: false, error: null, data: null });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                //Location fethcing based on IP
                const ip = await fetch("https://ipapi.co/json/").then(r => {
                    if (!r.ok) throw new Error("IP lookup failed");
                    return r.json();
                });

                const lat = ip.latitude, lon = ip.longitude;
                const place = [ip.city];
                const timeZone = ip.timezone;

                // Open Meteo weather fetching
                const base = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&temperature_unit=celsius`;
                let res = await fetch(`${base}&current=temperature_2m,weather_code`);
                let wx = await res.json();
                if (!res.ok) throw new Error(wx?.reason || "Weather fetch failed");

                let temp = wx?.current?.temperature_2m;
                let code = wx?.current?.weather_code;
                if (temp == null || code == null) {
                    res = await fetch(`${base}&current_weather=true`);
                    wx = await res.json();
                    if (!res.ok || !wx?.current_weather) throw new Error("Unexpected weather response");
                    temp = wx.current_weather.temperature;
                    code = wx.current_weather.weathercode;
                }

                const data = {
                    dateStr: new Intl.DateTimeFormat(undefined, {
                        weekday: "short", month: "short", day: "numeric", timeZone: timeZone || undefined,
                    }).format(new Date()),
                    place: place || "Your area",
                    temp: Math.round(temp),
                    desc: WMO[code] ?? "Weather",
                };

                if (!cancelled) setState({ loaded: true, error: null, data });
            } catch (e) {
                if (!cancelled) setState({ loaded: true, error: e.message || String(e), data: null });
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (!state.loaded) return <div>Loading weather…</div>;
    if (state.error) return <div style={{ color: "salmon" }}>Weather error: {state.error}</div>;

    const { dateStr, place, temp, desc } = state.data;
    return (
        <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{dateStr}</div>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{place}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 650, lineHeight: 1 }}>{temp}{THE_CORRECT_UNIT}</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{desc}</div>
            </div>
        </div>
    );
}