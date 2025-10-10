import React, { useContext, useEffect, useRef, useState } from "react";
import { GridCtx } from "../widget-grid/WidgetGrid";
import "../../css/widget-grid.css";

export default function Widget({
  id,
  col,
  row,
  w = 2,
  h = 2,
  color,
  className = "",
  style = {},
  onMove,
  children,
  title = "Widget",
}) {
  const ctx = useContext(GridCtx);
  if (!ctx) throw new Error("Widget must be used inside <WidgetGrid>.");

  const { cellToPxRect, clampToBounds, deltaPxToDeltaCells, widgetColor } = ctx;

  const [dragging, setDragging] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [ghost, setGhost] = useState({ c: col, r: row });
  const originRef = useRef({ c: col, r: row, x: 0, y: 0, pointerId: null });

  const accentColor = color || widgetColor;

  useEffect(() => {
    if (!dragging && !grabbed) setGhost({ c: col, r: row });
  }, [col, row, dragging, grabbed]);

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

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;

    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    originRef.current = { c: col, r: row, x: startX, y: startY, pointerId: e.pointerId };

    setDragging(true);
    setGhost({ c: col, r: row });
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
    setGhost({ c: next.c, r: next.r });
  };

  const endDrag = (commit) => {
    if (!dragging) return;
    setDragging(false);
    applyBodyDragStyles(false);
    if (commit && (ghost.c !== col || ghost.r !== row)) {
      onMove?.(id, { col: ghost.c, row: ghost.r });
    } else {
      setGhost({ c: col, r: row });
    }
  };

  const onPointerUp = () => endDrag(true);
  const onPointerCancel = () => endDrag(false);

  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!grabbed) {
        setGrabbed(true);
        setGhost({ c: col, r: row });
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
        setGhost({ c: col, r: row });
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
      setGhost(clamped);
      e.preventDefault();
    }
  };

  const rect = cellToPxRect(col, row, w, h);
  const ghostRect = cellToPxRect(ghost.c, ghost.r, w, h);

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

  return (
    <>
      {(dragging || grabbed) && (
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

      <div
        role="gridcell"
        aria-colindex={col + 1}
        aria-rowindex={row + 1}
        className={`ios-widget ${dragging || grabbed ? 'dragging' : ''} ${className}`}
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          '--accent-color': accentColor,
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
            {dragging || grabbed ? "Release to drop" : "Drag to move"}
          </div>
        </div>

        <div className="ios-widget-content">{children}</div>
      </div>
    </>
  );
}
