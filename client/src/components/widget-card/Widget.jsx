import React, { useContext, useEffect, useRef, useState } from "react";
import { GridCtx } from "../widget-grid/WidgetGrid";
import "../../css/widget-grid.css";

export default function Widget({
  id,
  col,
  row,
  w = 2,
  h = 2,
  minW = 1,
  minH = 1,
  maxW,
  maxH,
  color,
  className = "",
  style = {},
  onMove,
  onResize,
  onBringToFront,
  children,
  title = "Widget",
  zIndex = 1,
}) {
  const ctx = useContext(GridCtx);
  if (!ctx) throw new Error("Widget must be used inside <WidgetGrid>.");

  const { cellToPxRect, clampToBounds, deltaPxToDeltaCells, widgetColor, cellW, rowH, gap, cols, rows } = ctx;

  const [dragging, setDragging] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [ghost, setGhost] = useState({ c: col, r: row, w, h });
  const originRef = useRef({ c: col, r: row, w, h, x: 0, y: 0, pointerId: null });

  const accentColor = color || widgetColor;

  useEffect(() => {
    if (!dragging && !grabbed && !resizing) {
      setGhost({ c: col, r: row, w, h });
    }
  }, [col, row, w, h, dragging, grabbed, resizing]);

  const applyBodyDragStyles = (on) => {
    const body = document.body;
    if (!body) return;
    if (on) {
      body.style.userSelect = "none";
      body.style.cursor = "grabbing";
    } else {
      body.style.userSelect = "";
      body.style.cursor = "";
    }
  };

  // Drag handlers
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    
    // Bring to front when clicked
    onBringToFront?.(id);
    
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    originRef.current = { c: col, r: row, w, h, x: startX, y: startY, pointerId: e.pointerId };

    setDragging(true);
    setGhost({ c: col, r: row, w, h });
    applyBodyDragStyles(true);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const { x, y, c, r } = originRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    const { dc, dr } = deltaPxToDeltaCells(dx, dy);

    const next = clampToBounds(c + dc, r + dr, w, h);
    setGhost({ c: next.c, r: next.r, w, h });
  };

  const endDrag = (commit) => {
    if (!dragging) return;
    setDragging(false);
    applyBodyDragStyles(false);
    if (commit && (ghost.c !== col || ghost.r !== row)) {
      onMove?.(id, { col: ghost.c, row: ghost.r });
    } else {
      setGhost({ c: col, r: row, w, h });
    }
  };

  const onPointerUp = () => endDrag(true);
  const onPointerCancel = () => endDrag(false);

  // Resize handlers
  const onResizePointerDown = (e, handle) => {
    if (e.button != null && e.button !== 0) return;
    e.stopPropagation();
    
    // Bring to front when resizing
    onBringToFront?.(id);
    
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    originRef.current = { c: col, r: row, w, h, x: startX, y: startY, pointerId: e.pointerId };

    setResizing(true);
    setResizeHandle(handle);
    setGhost({ c: col, r: row, w, h });
    applyBodyDragStyles(true);
    e.preventDefault();
  };

  const onResizePointerMove = (e) => {
    if (!resizing || !resizeHandle) return;
    
    const { x, y, c, r, w: origW, h: origH } = originRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    
    let newCol = c;
    let newRow = r;
    let newW = origW;
    let newH = origH;

    // Calculate new dimensions based on handle
    if (resizeHandle.includes('e')) {
      const deltaW = Math.round(dx / (cellW + gap));
      newW = Math.max(minW, Math.min(maxW || cols, origW + deltaW));
      if (c + newW > cols) newW = cols - c;
    }
    if (resizeHandle.includes('w')) {
      const deltaW = Math.round(-dx / (cellW + gap));
      const tryW = origW + deltaW;
      if (tryW >= minW && c - deltaW >= 0) {
        newW = tryW;
        newCol = c - deltaW;
      }
    }
    if (resizeHandle.includes('s')) {
      const deltaH = Math.round(dy / (rowH + gap));
      newH = Math.max(minH, Math.min(maxH || rows, origH + deltaH));
      if (r + newH > rows) newH = rows - r;
    }
    if (resizeHandle.includes('n')) {
      const deltaH = Math.round(-dy / (rowH + gap));
      const tryH = origH + deltaH;
      if (tryH >= minH && r - deltaH >= 0) {
        newH = tryH;
        newRow = r - deltaH;
      }
    }

    setGhost({ c: newCol, r: newRow, w: newW, h: newH });
  };

  const endResize = (commit) => {
    if (!resizing) return;
    setResizing(false);
    setResizeHandle(null);
    applyBodyDragStyles(false);
    
    if (commit && (ghost.w !== w || ghost.h !== h || ghost.c !== col || ghost.r !== row)) {
      onResize?.(id, { w: ghost.w, h: ghost.h });
      if (ghost.c !== col || ghost.r !== row) {
        onMove?.(id, { col: ghost.c, row: ghost.r });
      }
    } else {
      setGhost({ c: col, r: row, w, h });
    }
  };

  const onResizePointerUp = () => endResize(true);
  const onResizePointerCancel = () => endResize(false);

  // Keyboard handlers
  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!grabbed) {
        setGrabbed(true);
        setGhost({ c: col, r: row, w, h });
      } else {
        setGrabbed(false);
        if (ghost.c !== col || ghost.r !== row) {
          onMove?.(id, { col: ghost.c, row: ghost.r });
        }
      }
      return;
    }
    if (e.key === "Escape") {
      if (grabbed) {
        setGrabbed(false);
        setGhost({ c: col, r: row, w, h });
        e.preventDefault();
      }
      return;
    }
    if (grabbed) {
      let { c, r } = ghost;
      if (e.key === "ArrowLeft") c -= 1;
      if (e.key === "ArrowRight") c += 1;
      if (e.key === "ArrowUp") r -= 1;
      if (e.key === "ArrowDown") r += 1;
      const clamped = clampToBounds(c, r, w, h);
      setGhost({ ...clamped, w, h });
      e.preventDefault();
    }
  };

  const rect = cellToPxRect(col, row, w, h);
  const ghostRect = cellToPxRect(ghost.c, ghost.r, ghost.w, ghost.h);

  const handleProps = {
    role: "button",
    tabIndex: 0,
    "aria-label": `${title} drag handle`,
    "aria-grabbed": dragging || grabbed ? "true" : "false",
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    className: "ios-widget-handle",
  };

  const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  return (
    <>
      {(dragging || grabbed || resizing) && (
        <div
          aria-hidden
          className="ios-widget-ghost"
          style={{
            left: ghostRect.x,
            top: ghostRect.y,
            width: ghostRect.w,
            height: ghostRect.h,
            borderColor: accentColor,
          }}
        />
      )}

      <article
        aria-label={`${title} widget`}
        className={`ios-widget ${dragging || grabbed || resizing ? 'dragging' : ''} ${className}`}
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          '--accent-color': accentColor,
          zIndex: zIndex,
          ...style,
        }}
      >
        <div
          {...handleProps}
          title="Drag to move"
        >
          <div className="ios-widget-grabber"></div>
          <div className="ios-widget-title" style={{ color: accentColor }}>
            {title}
          </div>
          <div className="ios-widget-hint">
            {dragging || grabbed ? "Release to drop" : resizing ? "Resizing..." : "Drag to move"}
          </div>
        </div>

        <div className="ios-widget-content">{children}</div>

{/* Resize handles */}
        {onResize && resizeHandles.map(handle => (
          <button
            type="button"
            key={handle}
            aria-label={`Resize ${title} widget from ${handle} corner`}
            className={`widget-resize-handle widget-resize-${handle}`}
            onPointerDown={(e) => onResizePointerDown(e, handle)}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Could implement keyboard resize here if needed
              }
            }}
            style={{
              position: 'absolute',
              zIndex: 10,
              border: 'none',
              padding: 0,
              background: 'rgba(99, 102, 241, 0.8)',
              borderRadius: 2,
              opacity: 0,
              transition: 'opacity 0.2s',
              ...(handle.includes('n') && { top: -4 }),
              ...(handle.includes('s') && { bottom: -4 }),
              ...(handle.includes('e') && { right: -4 }),
              ...(handle.includes('w') && { left: -4 }),
              ...((handle === 'n' || handle === 's') && { 
                left: '50%', 
                transform: 'translateX(-50%)',
                width: 32,
                height: 8,
                cursor: 'ns-resize'
              }),
              ...((handle === 'e' || handle === 'w') && { 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: 8,
                height: 32,
                cursor: 'ew-resize'
              }),
              ...((handle === 'ne' || handle === 'sw') && { 
                width: 12,
                height: 12,
                cursor: 'nesw-resize'
              }),
              ...((handle === 'nw' || handle === 'se') && { 
                width: 12,
                height: 12,
                cursor: 'nwse-resize'
              })
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          />
        ))}
      </article>
    </>
  );
}