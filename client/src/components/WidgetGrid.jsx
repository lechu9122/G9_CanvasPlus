import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import "../css/widget-grid.css";

const GridCtx = createContext(null);

export default function WidgetGrid({
  cols = 12,
  rows = 8,
  cellW = 96, // initial fallback only
  rowH = 96, // initial fallback only
  gap = 16,
  showGrid = true,
  className = "",
  style = {},
  children,
}) {
  const containerRef = useRef(null);
  const clipRef = useRef(null);
  const wallpaperRef = useRef(null);

  const [widgetColor, setWidgetColor] = useState("#007AFF");
  const [wallpaper, setWallpaper] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Derived cell sizes so the grid fills the viewport area exactly
  const [cw, setCw] = useState(cellW);
  const [rh, setRh] = useState(rowH);

  // Recompute cell sizes from the clip’s live size
  useLayoutEffect(() => {
    const el = clipRef.current;
    if (!el) return;

    const recompute = () => {
      const rect = el.getBoundingClientRect();
      const availW = rect.width;
      const availH = rect.height;

      const nextCw = (availW - (cols - 1) * gap) / cols;
      const nextRh = (availH - (rows - 1) * gap) / rows;

      setCw(nextCw);
      setRh(nextRh);
    };

    // Run now
    recompute();

    // Watch size changes
    const ro = new ResizeObserver(recompute);
    ro.observe(el);

    // Track URL bar / viewport dynamic changes
    const onVV = () => recompute();
    window.addEventListener("resize", onVV);
    window.visualViewport?.addEventListener("resize", onVV);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onVV);
      window.visualViewport?.removeEventListener?.("resize", onVV);
    };
  }, [cols, rows, gap]);

  const gridW = cols * cw + (cols - 1) * gap;
  const gridH = rows * rh + (rows - 1) * gap;

  // Subtle parallax wallpaper
  useEffect(() => {
    if (!wallpaperRef.current) return;

    const handlePointerMove = (e) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = wallpaperRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const moveX = ((e.clientX - rect.left - centerX) / centerX) * 6;
      const moveY = ((e.clientY - rect.top - centerY) / centerY) * 6;
      wallpaperRef.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    };

    const handlePointerLeave = () => {
      wallpaperRef.current.style.transform = "translate3d(0, 0, 0)";
    };

    const el = wallpaperRef.current;
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  const handleWallpaperUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.match("image.*")) {
      const reader = new FileReader();
      reader.onload = (ev) => setWallpaper(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => setWidgetColor(e.target.value);

  const ctxValue = useMemo(() => {
    const spanX = cw + gap;
    const spanY = rh + gap;

    const cellToPxRect = (c, r, w, h) => ({
      x: c * spanX,
      y: r * spanY,
      w: w * cw + (w - 1) * gap,
      h: h * rh + (h - 1) * gap,
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
      cellW: cw,
      rowH: rh,
      gap,
      gridW,
      gridH,
      spanX,
      spanY,
      gridRef: containerRef,
      widgetColor,
      cellToPxRect,
      clampToBounds,
      deltaPxToDeltaCells,
    };
  }, [cols, rows, cw, rh, gap, gridW, gridH, widgetColor]);

  return (
    <GridCtx.Provider value={ctxValue}>
      <div className="ios-widget-grid-container" ref={containerRef}>
        <button
          className="ios-settings-button"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Open settings"
        >
          ⚙️
        </button>

        {showSettings && (
          <div className="ios-settings-panel">
            <h3>Customize Widgets</h3>

            <div className="ios-setting-group">
              <label>Widget Color</label>
              <input
                type="color"
                value={widgetColor}
                onChange={handleColorChange}
                className="ios-color-picker"
              />
              <div
                className="color-preview"
                style={{ backgroundColor: widgetColor }}
              >
                Current Color: {widgetColor}
              </div>
            </div>

            <div className="ios-setting-group">
              <label>Wallpaper</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="ios-wallpaper-upload"
              />
            </div>

            <button
              className="ios-close-settings"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        )}

        {/* Full-viewport clip */}
        <div className="ios-grid-clip" ref={clipRef}>
          <div
            className="ios-wallpaper"
            ref={wallpaperRef}
            style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : {}}
          />

          <div
            role="grid"
            aria-rowcount={rows}
            aria-colcount={cols}
            className={`ios-widget-grid ${className} ${showGrid ? "show-grid" : ""}`}
            style={{
              width: gridW,
              height: gridH,
              "--cell-width": `${cw}px`,
              "--cell-height": `${rh}px`,
              "--grid-gap": `${gap}px`,
              ...style,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </GridCtx.Provider>
  );
}
export function Widget({
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

  const {
    spanX,
    spanY,
    widgetColor,
    cellToPxRect,
    clampToBounds,
    deltaPxToDeltaCells,
  } = ctx;

  const [dragging, setDragging] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const [ghost, setGhost] = useState({ c: col, r: row });
  const originRef = useRef({ c: col, r: row, x: 0, y: 0, pointerId: null });

  const accentColor = color || widgetColor;

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
          <div className="ios-widget-grabber">

          </div>
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