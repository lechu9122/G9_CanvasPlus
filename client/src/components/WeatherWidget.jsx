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

// when looking outside doesnt work anymore
function getIsNight(timeZone) {
    try {
        const hour = Number(
            new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                hour12: false,
                timeZone: timeZone || undefined,
            }).format(new Date())
        );
        return hour < 6 || hour >= 18;
    } catch {
        return false;
    }
}

function getWeatherIcon(code, isNight) {
    if (code === 0) return isNight ? "🌙" : "☀️";
    if (code === 1) return isNight ? "🌙" : "🌤️";
    if (code === 2) return isNight ? "☁️" : "⛅";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code === 51 || code === 53 || code === 55) return "🌦️";
    if (code === 61 || code === 63 || code === 65) return "🌧️";
    if (code === 66 || code === 67) return "🧊🌧️";
    if (code === 71 || code === 73 || code === 75 || code === 77) return "❄️";
    if (code === 80 || code === 81 || code === 82) return "🌦️";
    if (code === 85 || code === 86) return "🌨️";
    if (code === 95) return "⛈️";
    if (code === 96 || code === 99) return "⛈️🧊";
    return "🌡️";
}

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
                const place = ip.city || " ";
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
                const isNight = getIsNight(timeZone);
                const data = {
                    dateStr: new Intl.DateTimeFormat(undefined, {
                        weekday: "short", month: "short", day: "numeric", timeZone: timeZone || undefined,
                    }).format(new Date()),
                    place: place || "Your area",
                    temp: Math.round(temp),
                    desc: WMO[code] ?? "Weather",
                    icon: getWeatherIcon(code, isNight),
                };

                if (!cancelled) setState({ loaded: true, error: null, data });
            } catch (e) {
                if (!cancelled) setState({ loaded: true, error: e.message || String(e), data: null });
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (!state.loaded) return <div>Loading weather…</div>;
    if (state.error) return <div style={{ color: "salmon" }}>Weather error: {state.error}</div>; // oh piss

    const { dateStr, place, temp, desc, icon } = state.data;
    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Top-Right: date */}
            <div style={{ position: "absolute", top: 0, right: 0, fontSize: 12, opacity: 0.75, textAlign: "right" }}>
                {dateStr}
            </div>

            {/* Top-left: location (bold) + smaller weather text */}
            <div style={{ position: "absolute", top:0, left:0, textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{place}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{desc}</div>
            </div>

            {/* Center: large symbol and temperature */}
            {/* CENTER: emoji */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "40%",
                    transform: "translate(-50%, -50%)", // perfect center
                    lineHeight: 0,
                }}
            >
      <span role="img" aria-label={desc} style={{ fontSize: 56, lineHeight: 1 }}>
        {icon}
      </span>
            </div>

            {/* BOTTOM: temperature (sits between bottom edge and the emoji) */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 6,              // nudge as you like
                    textAlign: "center",
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1,
                }}
            >
                {temp}°C
            </div>
        </div>
    );
}