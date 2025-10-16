// client/src/components/widget-grid/WidgetGrid.jsx
import React, {
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import "../../css/widget-grid.css";
import {
  getUserPreferences,
  saveUserPreferences,
} from "../../api/preferences.js";
import { supabase } from "../../auth/supabaseClient.js";
import { useSignOut } from "../../hooks/useSignOut.js";

const GridCtx = React.createContext(null);

// simple debounce helper
const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

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
                                     onResetLayout,
                                   }) {
  const containerRef = useRef(null);
  const clipRef = useRef(null);
  const wallpaperRef = useRef(null);

  const [widgetColor, setWidgetColor] = useState("#007AFF");
  const [wallpaper, setWallpaper] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(null);
  
  // Logout hook
  const { signOut, isLoading: isLoggingOut } = useSignOut();

  // Derived cell sizes so the grid fills the viewport area exactly
  const [cw, setCw] = useState(cellW);
  const [rh, setRh] = useState(rowH);

  // gate saving until DB has hydrated
  const hydratedRef = useRef(false);

  // auth
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // load preferences once
  useEffect(() => {
    if (!user) return;
    (async () => {
      const prefs = await getUserPreferences(user.id);
      if (prefs) {
        if (prefs.theme_color) setWidgetColor(prefs.theme_color);
        if (prefs.background_type === "image" && prefs.background_value) {
          setWallpaper(prefs.background_value);
        } else if (prefs.background_type === "color" && prefs.background_value) {
          // use solid-color background mode (optional)
          setWallpaper(null);
          // If you want to apply page bg color, uncomment:
          // document.body.style.backgroundColor = prefs.background_value;
        }
      }
      hydratedRef.current = true;
    })();
  }, [user]);

  // auto-save when prefs change, but only after hydration
  useEffect(() => {
    if (!user || !hydratedRef.current) return;
    saveUserPreferences({
      userId: user.id,
      themeColor: widgetColor,
      backgroundType: wallpaper ? "image" : "color",
      backgroundValue: wallpaper || widgetColor,
    }).catch(console.error);
  }, [user, widgetColor, wallpaper]);

  // debounced explicit save from handlers
  const debouncedSave = useRef(
      debounce((payload) => saveUserPreferences(payload).catch(console.error), 300)
  ).current;

  // Recompute cell sizes from the clip's live size
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

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(el);

    // Track viewport changes
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
    if (file?.type.match("image.*")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = ev.target.result;
        setWallpaper(img);
        if (user?.id && hydratedRef.current) {
          debouncedSave({
            userId: user.id,
            themeColor: widgetColor,
            backgroundType: "image",
            backgroundValue: img,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    const next = e.target.value;
    setWidgetColor(next);
    if (user && hydratedRef.current) {
      debouncedSave({
        userId: user.id,
        themeColor: next,
        backgroundType: wallpaper ? "image" : "color",
        backgroundValue: wallpaper || next,
      });
    }
  };

  const handleResetLayout = () => {
    if (window.confirm('Reset all widgets to default layout? This cannot be undone.')) {
      onResetLayout?.();
    }
  };

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

            {/* User Info Section */}
            {user && (
              <div className="ios-setting-group ios-user-info">
                <div className="ios-user-avatar">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ios-user-details">
                  <div className="ios-user-name">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="ios-user-email">{user.email}</div>
                </div>
              </div>
            )}

            <div className="ios-setting-group">
              <label htmlFor="wg-color">Widget Color</label>
              <input
                id="wg-color"
                type="color"
                value={widgetColor}
                onChange={handleColorChange}
                className="ios-color-picker"
              />
              <div
                className="color-preview"
                style={{ backgroundColor: widgetColor }}
              >
                {widgetColor}
              </div>
            </div>

            <div className="ios-setting-group">
              <label htmlFor="wg-wallpaper">Wallpaper</label>
              <input
                id="wg-wallpaper"
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="ios-wallpaper-upload"
              />
            </div>

            <div className="ios-setting-group">
              <button
                onClick={handleResetLayout}
                className="ios-reset-layout-btn"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Reset Layout
              </button>
            </div>

            {/* Logout Button */}
            {user && (
              <button
                className="ios-logout-button"
                onClick={signOut}
                disabled={isLoggingOut}
                aria-label="Log out"
              >
                <svg
                  className="ios-logout-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17L21 12L16 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isLoggingOut ? (
                  <>
                    <span className="ios-logout-spinner" aria-hidden="true"></span>
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Log Out</span>
                )}
              </button>
            )}

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
            className={`ios-widget-grid ${className} ${
              showGrid ? "show-grid" : ""
            }`}
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

export { GridCtx };