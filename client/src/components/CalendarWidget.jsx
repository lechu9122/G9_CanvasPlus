// components/CalendarWidget.jsx
import React from "react";
import useGoogleCalendarEvents from "../hooks/useGoogleCalendarEvents";

export default function CalendarWidget({ maxResults = 10, timeMin = new Date() }) {
const normalizedTimeMin = useMemo(() => {
    if (typeof timeMin === "string") return timeMin;
    if (timeMin instanceof Date) return timeMin.toISOString();
    try { return new Date(timeMin).toISOString(); } catch { return new Date().toISOString(); }
  }, [timeMin]);

  const {
    events,
    loading,
    error,
    needsAuth,
    signIn, // must remain synchronous inside the click handler
  } = useGoogleCalendarEvents({ maxResults, timeMin: normalizedTimeMin });

const formatStart = (ev) => {
    const dt = ev.start?.dateTime;      // timed events
    const d  = ev.start?.date;          // all-day events (YYYY-MM-DD)
    if (dt) {
        const date = new Date(dt);
        return new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }
    if (d) {
        return new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        }).format(new Date(d + "T00:00:00"));
    }
    return "(no date)";
  };
  
  // Loading state (init or fetching)
  if (loading) {
    return <div>Loading events…</div>;
  }

  // Auth required: keep the click handler synchronous; no await before signIn()
  if (needsAuth) {
    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          Sign in to view your calendar events.
        </div>
        <button
          type="button"
          onClick={() => { /* IMPORTANT: synchronous user gesture */ signIn(); }}
          style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
          aria-label="Sign in with Google"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ color: "salmon" }}>
        <strong>Error:</strong> {String(error)}
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
          Tips: ensure the Google Identity script can load (disable ad blockers/CSP),
          your email is a Test user (if using Testing mode), and{" "}
          <code>VITE_GOOGLE_CLIENT_ID</code> is set. Also authorize{" "}
          <code>http://localhost:5173</code> as a JavaScript origin.
        </div>
      </div>
    );
  }

  // No events
  if (!events || events.length === 0) {
    return <div>No upcoming events</div>;
  }

  // Render events
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {events.map((ev) => (
        <li key={ev.id}>
          [{formatStart(ev)}] | {ev.summary || "(no title)"}
        </li>
      ))}
    </ul>
  );
}