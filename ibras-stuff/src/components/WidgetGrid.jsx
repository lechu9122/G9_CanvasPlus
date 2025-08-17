// =============================
// File: /components/WidgetGrid.jsx
// =============================
import React, { createContext, useContext, useMemo, useRef, useEffect, useState, useCallback } from "react";


import { GridCtx } from "./WidgetGridContext";

export default function WidgetGrid({
  cols = 12,
  rows = 8,
  gap = 16,
  showGrid = true,
  className = "",
  style = {},
  maxCellWidth,
  maxCellHeight,
  children,
}) {
  const gridRef = useRef(null);
  const [dimensions, setDimensions] = useState({ cellW: 0, rowH: 0 });

  // Calculate cell dimensions based on available space
  useEffect(() => {
    const calculateDimensions = () => {
      if (!gridRef.current?.parentElement) return;
      
      // Get available space from parent container
      const parent = gridRef.current.parentElement;
      const availableWidth = parent.clientWidth;
      const availableHeight = parent.clientHeight;
      
      // Calculate cell dimensions with gap included
      let cellW = (availableWidth - (cols - 1) * gap) / cols;
      let rowH = (availableHeight - (rows - 1) * gap) / rows;
      
      // Apply max constraints if provided
      if (maxCellWidth) cellW = Math.min(cellW, maxCellWidth);
      if (maxCellHeight) rowH = Math.min(rowH, maxCellHeight);
      
      setDimensions({ cellW, rowH });
    };

    calculateDimensions();
    
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (gridRef.current?.parentElement) {
      resizeObserver.observe(gridRef.current.parentElement);
    }
    
    window.addEventListener('resize', calculateDimensions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [cols, rows, gap, maxCellWidth, maxCellHeight]);

  const gridW = cols * dimensions.cellW + (cols - 1) * gap;
  const gridH = rows * dimensions.rowH + (rows - 1) * gap;

  const background = showGrid
    ? {
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
        `,
        backgroundSize: `${dimensions.cellW + gap}px ${dimensions.rowH + gap}px`,
        backgroundPosition: `0 0`,
      }
    : {};

  const ctxValue = useMemo(() => {
    const spanX = dimensions.cellW + gap;
    const spanY = dimensions.rowH + gap;

    const cellToPxRect = (c, r, w, h) => ({
      x: c * spanX,
      y: r * spanY,
      w: w * dimensions.cellW + (w - 1) * gap,
      h: h * dimensions.rowH + (h - 1) * gap,
    });

    const clampToBounds = (c, r, w, h) => {
      const maxC = Math.max(0, cols - w);
      const maxR = Math.max(0, rows - h);
      return {
        c: Math.min(Math.max(0, c), maxC),
        r: Math.min(Math.max(0, r), maxR),
      };
    };

    const deltaPxToDeltaCells = (dx, dy) => ({
      dc: Math.round(dx / spanX),
      dr: Math.round(dy / spanY),
    });

    return {
      cols,
      rows,
      cellW: dimensions.cellW,
      rowH: dimensions.rowH,
      gap,
      gridW,
      gridH,
      spanX,
      spanY,
      gridRef,
      cellToPxRect,
      clampToBounds,
      deltaPxToDeltaCells,
    };
  }, [cols, rows, dimensions.cellW, dimensions.rowH, gap, gridW, gridH]);

  // Don't render until we've calculated dimensions
  if (dimensions.cellW <= 0 || dimensions.rowH <= 0) {
    return <div ref={gridRef} className={className} style={style} />;
  }

  return (
    <GridCtx.Provider value={ctxValue}>
      <div
        ref={gridRef}
        role="grid"
        aria-rowcount={rows}
        aria-colcount={cols}
        className={className}
        style={{
          position: "relative",
          width: gridW,
          height: gridH,
          borderRadius: 12,
          backgroundColor: "#0f1117",
          ...background,
          ...style,
        }}
      >
        {children}
      </div>
    </GridCtx.Provider>
  );
}
