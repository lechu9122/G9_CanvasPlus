import React, { useState, useCallback, useEffect } from "react";
import WidgetGrid, { Widget } from "./components/WidgetGrid.jsx";
import useGoogleCalendarEvents from "./hooks/useGoogleCalendarEvents";
import useWidgetLayout from "./hooks/useWidgetLayout";
import { supabase } from "./auth/supabaseClient.js";

import WeatherWidget from "./components/WeatherWidget.jsx";
import GptWrapper from "./components/GptWrapper.jsx";
import ClockWidget from "./components/ClockWidget.jsx";
import SearchWidget from "./components/SearchWidget.jsx";
import DailyScheduleWidget from "./components/DailyScheduleWidget.jsx";
import TodoWidget from "./components/TodoWidget.jsx";
import NotesWidget from './components/NotesWidget';
import CanvasWidget from "./components/CanvasWidget.jsx";

const BOUNCE_TIME = 800; // ms
const SIGN_IN_BUTTON_STYLE = {
  background: '#6366f1',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  marginTop: 8
};

// Extract calendar content into separate component
const CalendarWidgetContent = ({ calLoading, needsAuth, error, events, signIn }) => {
  if (calLoading) {
    return <div>Loading events...</div>;
  }

  if (needsAuth) {
    return (
      <div>
        <button onClick={signIn} style={SIGN_IN_BUTTON_STYLE}>
          Sign in to Google Calendar
        </button>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'salmon' }}>Error: {error}</div>;
  }

  if (!events || events.length === 0) {
    return <div>No upcoming events</div>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {events.map(ev => (
        <li key={ev.id}>
          {ev.summary || '(no title)'} ({ev.start?.dateTime?.slice(11, 16) || ev.start?.date})
        </li>
      ))}
    </ul>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [zIndexMap, setZIndexMap] = useState({});
  const [maxZIndex, setMaxZIndex] = useState(1);

  // Auth
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Layout management
  const { layout, loading, updateLayout, resetLayout, currentBreakpoint } = useWidgetLayout(user);

  // Calendar hook
  const { events, loading: calLoading, error, needsAuth, signIn } = useGoogleCalendarEvents();

  const handleMove = useCallback((id, pos) => {
    const updated = layout.map((w) =>
      w.id === id ? { ...w, col: pos.col, row: pos.row } : w
    );
    updateLayout(updated);
  }, [layout, updateLayout]);

  const handleResize = useCallback((id, dimensions) => {
    const updated = layout.map((w) =>
      w.id === id ? { ...w, ...dimensions } : w
    );
    updateLayout(updated);
  }, [layout, updateLayout]);

  const handleBringToFront = useCallback((id) => {
    setMaxZIndex(prev => {
      const newMax = prev + 1;
      setZIndexMap(prevMap => ({ ...prevMap, [id]: newMax }));
      return newMax;
    });
  }, []);

  // Show loading screen while fetching layout from Supabase
  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading dashboard...</div>;
  }

  // Get columns based on breakpoint
  let cols;
  if (currentBreakpoint === 'lg') {
    cols = 17;
  } else if (currentBreakpoint === 'md') {
    cols = 10;
  } else if (currentBreakpoint === 'sm') {
    cols = 6;
  } else {
    cols = 4;
  }

  return (
    <WidgetGrid 
      cols={cols}
      rows={8} 
      cellW={96} 
      rowH={96} 
      gap={16} 
      showGrid={false}
      onResetLayout={resetLayout}
    >
      {layout.map((w) => (
        <Widget
          key={w.id}
          id={w.id}
          title={w.title || w.id}
          col={w.col}
          row={w.row}
          w={w.w}
          h={w.h}
          minW={w.minW}
          minH={w.minH}
          maxW={w.maxW}
          maxH={w.maxH}
          color={w.color}
          zIndex={zIndexMap[w.id] || 1}
          onMove={handleMove}
          onResize={handleResize}
          onBringToFront={handleBringToFront}
        >
          {w.id === "weather" && <WeatherWidget />}
          {w.id === "search" && <SearchWidget />}
          {w.id === "clock" && <ClockWidget />}
          {w.id === "gptWrapper" && <GptWrapper />}
          {w.id === "calendar" && (
            <CalendarWidgetContent 
              calLoading={calLoading}
              needsAuth={needsAuth}
              error={error}
              events={events}
              signIn={signIn}
            />
          )}
          {w.id === "todo" && <TodoWidget />}
          {w.id === "canvas" && <CanvasWidget />}
          {w.id === "schedule" && <DailyScheduleWidget />}
          {w.id === "notes" && <NotesWidget />}
        </Widget>
      ))}
    </WidgetGrid>
  );
}