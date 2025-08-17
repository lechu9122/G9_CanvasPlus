// =============================
// File: app.jsx
// =============================
import React, { useState, useCallback } from "react";
import WidgetGrid from "./components/WidgetGrid.jsx";
import Widget from "./components/Widget.jsx";

export default function App() {
  const [widgets, setWidgets] = useState([
    { id: "weather", title: "Weather", col: 0, row: 0, w: 3, h: 2, color: "#1f2937" },
    { id: "calendar", title: "Calendar", col: 3, row: 0, w: 4, h: 3, color: "#0d9488" },
    { id: "notes", title: "Notes", col: 0, row: 2, w: 3, h: 3, color: "#7c3aed" },
  ]);

  const handleMove = useCallback((id, pos) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, col: pos.col, row: pos.row } : w))
    );
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "#0b0e14",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial",
      }}
    >
      {/* Container that will determine the available space */}
      <div style={{ 
        width: "90vw", 
        height: "90vh",
        maxWidth: "1600px",
        maxHeight: "1200px",
        position: "relative"
      }}>
        <WidgetGrid 
          cols={12} 
          rows={8} 
          gap={16} 
          showGrid
          maxCellWidth={120}  // optional max cell width
          maxCellHeight={120} // optional max cell height
        >
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
              {/* Widget content remains the same */}
              {w.id === "weather" && (
                <div>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>Auckland</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>High 15° • Low 8° • Showers</div>
                </div>
              )}
              {/* ... other widget contents */}
            </Widget>
          ))}
        </WidgetGrid>
      </div>
    </div>
  );
}