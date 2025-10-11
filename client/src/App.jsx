// =============================
// File: app.jsx
// =============================

import React, { useState, useCallback } from "react";
import WidgetGrid, { Widget } from "./components/WidgetGrid.jsx";
import useGoogleCalendarEvents from "./hooks/useGoogleCalendarEvents";

import WeatherWidget from "./components/WeatherWidget.jsx"
import GptWrapper from "./components/GptWrapper.jsx"
import ClockWidget from "./components/ClockWidget.jsx";
import SearchWidget from "./components/SearchWidget.jsx"
import DailyScheduleWidget from "./components/DailyScheduleWidget.jsx";
import TodoWidget from "./components/TodoWidget.jsx";
import NotesWidget from './components/NotesWidget';
import CanvasWidget from "./components/CanvasWidget.jsx";


export default function App() {
  const [widgets, setWidgets] = useState([
       { id: "weather", title: "Weather", col: 0, row: 0, w: 2, h: 2 },
    { id: "clock", title: "Clock", col: 0, row: 5, w: 5, h: 2},
    { id: "calendar", title: "Calendar", col: 3, row: 0, w: 4, h: 3},
    { id: "todo", title: "TODO List", col: 7, row: 0, w: 3, h: 4 },
    { id: "schedule", title: "Daily Schedule", col: 10, row: 0, w: 4, h: 4.2 },
    { id: "notes", title: "Notes", col: 0, row: 2, w: 3, h: 3 },
    { id: "gptWrapper", title: "ChatGPTWrapper", col: 3, row: 4, w: 6, h: 3 },
    { id: "search", title: "Search", col: 7, row: 0, w: 4, h: 1 },
    { id: "canvas", title: "Canvas Tasks", col: 9, row: 3, w: 3, h: 4 },

  ]);

  const handleMove = useCallback((id, pos) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, col: pos.col, row: pos.row } : w))
    );
  }, []);

  // Hook must be called at component top-level
  const { events, loading, error, needsAuth, signIn } = useGoogleCalendarEvents();

  return (
    <>

      {/* Add button row (if you want a global add, otherwise move this to widgets) */}


      <WidgetGrid cols={17} rows={8} cellW={96} rowH={96} gap={16} showGrid>
        {widgets.map((w) => (
          <Widget
            key={w.id}
            id={w.id}
            title={w.title}
            col={w.col}
            row={w.row}
            w={w.w}
            h={w.h}
            color={w.color}
            onMove={handleMove}
          >
            {w.id === "weather" && <WeatherWidget />}
            {w.id === "search" && <SearchWidget />}
            {w.id === "clock" && <ClockWidget />}
            {w.id === "gptWrapper" && <GptWrapper />}
            {w.id === "calendar" && (
              loading ? (
                <div>Loading events...</div>
              ) : needsAuth ? (
                <div>
                  <button onClick={signIn} style={{
                    background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 8
                  }}>Sign in to Google Calendar</button>
                </div>
              ) : error ? (
                <div style={{ color: 'salmon' }}>Error: {error}</div>
              ) : (!events || events.length === 0) ? (
                <div>No upcoming events</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {events.map(ev => (
                    <li key={ev.id}>{ev.summary || '(no title)'} ({ev.start?.dateTime?.slice(11, 16) || ev.start?.date})</li>
                  ))}
                </ul>
              )
            )}

            {w.id === "todo" && <TodoWidget />}
            {w.id === "canvas" && <CanvasWidget />}
            {w.id === "schedule" && <DailyScheduleWidget />}
            {w.id === "notes" && <NotesWidget />}
          </Widget>
        ))}
      </WidgetGrid>
    </>
  );
}