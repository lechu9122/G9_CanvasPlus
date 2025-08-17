import React, { useContext, useState, useEffect, useRef } from "react";
import { GridCtx } from "./WidgetGridContext";

export default function Widget({
  id,
  col,
  row,
  w = 2,
  h = 2,
  color = "#1f2937",
  className = "",
  style = {},
  onMove,
  children,
  title = "Widget",
}) {
  const ctx = useContext(GridCtx);
  if (!ctx) throw new Error("Widget must be used inside <WidgetGrid>.");

  const {
    spanX,
    spanY,
    cellW,
    rowH,
    gap,
    cellToPxRect,
    clampToBounds,
    deltaPxToDeltaCells,
    gridRef,
  } = ctx;

  const [dragging, setDragging] = useState(false);
  const [grabbed, setGrabbed] = useState(false); // keyboard grab mode
  const [ghost, setGhost] = useState({ c: col, r: row }); // landing preview
  const originRef = useRef({ c: col, r: row, x: 0, y: 0, pointerId: null });

  // keep ghost in sync if parent moves externally
  useEffect(() => {
    if (!dragging && !grabbed) setGhost({ c: col, r: row });
  }, [col, row, dragging, grabbed]);

  const px = cellToPxRect(col, row, w, h);

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
    // only left button or primary touch
    if ((e.button !== null && e.button !== undefined) && e.button !== 0) return;

    // start drag via handle only
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
      // reset preview if cancelled
      setGhost({ c: col, r: row });
    }
  };

  const onPointerUp = () => endDrag(true);
  const onPointerCancel = () => endDrag(false);

  // Keyboard a11y on the handle
  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!grabbed) {
        // start keyboard grab
        setGrabbed(true);
        setGhost({ c: col, r: row });
      } else {
        // drop
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

  // Style/rects
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
    style: {
      cursor: dragging ? "grabbing" : "grab",
      touchAction: "none", // prevent scroll while dragging on touch
    },
  };

  return (
    <>
      {/* Landing preview (ghost) */}
      {(dragging || grabbed) && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: ghostRect.x,
            top: ghostRect.y,
            width: ghostRect.w,
            height: ghostRect.h,
            border: "2px dashed rgba(255,255,255,0.35)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}

      {/* Actual widget */}
      <div
        role="gridcell"
        aria-colindex={col + 1}
        aria-rowindex={row + 1}
        className={className}
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          borderRadius: 12,
          background: color,
          boxShadow: dragging || grabbed ? "0 0 0 3px rgba(99, 102, 241, 0.8)" : "0 1px 10px rgba(0,0,0,0.25)",
          transition: dragging || grabbed ? "none" : "left 160ms, top 160ms, box-shadow 160ms",
          overflow: "hidden",
          color: "white",
          ...style,
        }}
      >
        {/* Handle bar */}
        <div
          {...handleProps}
          title="Drag to move"
          style={{
            ...handleProps.style,
            height: 36,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            userSelect: "none",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)",
              opacity: 0.8,
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.2 }}>{title}</div>
          <div style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>
            {dragging || grabbed ? "Release to drop" : "Drag handle"}
          </div>
        </div>

        {/* Content area (stays interactive) */}
        <div style={{ padding: 12, width: "100%", height: `calc(100% - 36px)`, overflow: "auto" }}>{children}</div>
      </div>
    </>
  );
}
