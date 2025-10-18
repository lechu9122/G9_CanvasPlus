import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../auth/supabaseClient.js';

// ============================================
// WIDGET SIZE CONSTRAINTS - EDIT HERE
// ============================================
const WIDGET_CONSTRAINTS = {
  weather: { minW: 2, minH: 2, maxW: 4, maxH: 4 },
  clock: { minW: 3, minH: 1, maxW: 8, maxH: 3 },
  calendar: { minW: 3, minH: 3, maxW: 8, maxH: 6 },
  todo: { minW: 2, minH: 3, maxW: 5, maxH: 8 },
  schedule: { minW: 3, minH: 3, maxW: 6, maxH: 8 },
  notes: { minW: 2, minH: 2, maxW: 6, maxH: 6 },
  gptWrapper: { minW: 4, minH: 3, maxW: 10, maxH: 8 },
  search: { minW: 2, minH: 1, maxW: 8, maxH: 2 },
  canvas: { minW: 2, minH: 3, maxW: 6, maxH: 8 },
  linkVault: { minW: 2, minH: 3, maxW: 6, maxH: 8 },
};

// Time to debounce layout saves
const BOUNCE_TIME = 800; // ms

const DEFAULT_LAYOUTS = {
  lg: [
    { id: "weather", title: "Weather", col: 0, row: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { id: "clock", title: "Clock", col: 0, row: 5, w: 5, h: 2, minW: 3, minH: 1 },
    { id: "calendar", title: "Calendar", col: 3, row: 0, w: 4, h: 3, minW: 4, minH: 3 },
    { id: "todo", title: "TODO List", col: 7, row: 0, w: 3, h: 4, minW: 3, minH: 3 },
    { id: "schedule", title: "Daily Schedule", col: 10, row: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { id: "notes", title: "Notes", col: 0, row: 2, w: 3, h: 3, minW: 2, minH: 2 },
    { id: "gptWrapper", title: "ChatGPT", col: 3, row: 4, w: 6, h: 3, minW: 4, minH: 3 },
    { id: "search", title: "Search", col: 7, row: 0, w: 4, h: 1, minW: 3, minH: 1 },
    { id: "canvas", title: "Canvas Tasks", col: 9, row: 4, w: 3, h: 4, minW: 3, minH: 3 },
    { id: "linkVault", title: "Link Vault", col: 12, row: 4, w: 3, h: 4, minW: 3, minH: 3 },
  ],
  md: [
    { id: "weather", title: "Weather", col: 0, row: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { id: "clock", title: "Clock", col: 0, row: 5, w: 4, h: 2, minW: 3, minH: 1 },
    { id: "calendar", title: "Calendar", col: 2, row: 0, w: 4, h: 3, minW: 3, minH: 3 },
    { id: "todo", title: "TODO List", col: 6, row: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { id: "schedule", title: "Daily Schedule", col: 0, row: 7, w: 4, h: 4, minW: 3, minH: 3 },
    { id: "notes", title: "Notes", col: 0, row: 2, w: 2, h: 3, minW: 2, minH: 2 },
    { id: "gptWrapper", title: "ChatGPT", col: 2, row: 3, w: 5, h: 3, minW: 4, minH: 3 },
    { id: "search", title: "Search", col: 6, row: 0, w: 3, h: 1, minW: 2, minH: 1 },
    { id: "canvas", title: "Canvas Tasks", col: 4, row: 7, w: 3, h: 4, minW: 2, minH: 3 },
    { id: "linkVault", title: "Link Vault", col: 6, row: 7, w: 3, h: 4, minW: 2, minH: 3 },
  ],
  sm: [
    { id: "weather", title: "Weather", col: 0, row: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { id: "clock", title: "Clock", col: 0, row: 8, w: 3, h: 2, minW: 2, minH: 1 },
    { id: "calendar", title: "Calendar", col: 0, row: 2, w: 3, h: 3, minW: 2, minH: 3 },
    { id: "todo", title: "TODO List", col: 3, row: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { id: "schedule", title: "Daily Schedule", col: 0, row: 10, w: 3, h: 4, minW: 2, minH: 3 },
    { id: "notes", title: "Notes", col: 3, row: 4, w: 3, h: 3, minW: 2, minH: 2 },
    { id: "gptWrapper", title: "ChatGPT", col: 0, row: 5, w: 4, h: 3, minW: 3, minH: 3 },
    { id: "search", title: "Search", col: 2, row: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { id: "canvas", title: "Canvas Tasks", col: 3, row: 7, w: 3, h: 3, minW: 2, minH: 3 },
    { id: "linkVault", title: "Link Vault", col: 3, row: 5, w: 3, h: 3, minW: 2, minH: 3 },
  ],
  xs: [
    { id: "weather", title: "Weather", col: 0, row: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { id: "clock", title: "Clock", col: 0, row: 10, w: 2, h: 2, minW: 2, minH: 1 },
    { id: "calendar", title: "Calendar", col: 0, row: 2, w: 2, h: 3, minW: 2, minH: 3 },
    { id: "todo", title: "TODO List", col: 2, row: 0, w: 2, h: 4, minW: 2, minH: 3 },
    { id: "schedule", title: "Daily Schedule", col: 0, row: 12, w: 2, h: 4, minW: 2, minH: 3 },
    { id: "notes", title: "Notes", col: 2, row: 4, w: 2, h: 3, minW: 2, minH: 2 },
    { id: "gptWrapper", title: "ChatGPT", col: 0, row: 5, w: 3, h: 3, minW: 2, minH: 3 },
    { id: "search", title: "Search", col: 0, row: 0, w: 2, h: 1, minW: 2, minH: 1 },
    { id: "canvas", title: "Canvas Tasks", col: 2, row: 7, w: 2, h: 3, minW: 2, minH: 3 },
    { id: "linkVault", title: "Link Vault", col: 2, row: 5, w: 2, h: 3, minW: 2, minH: 3 },
  ],
};

const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
};

function getCurrentBreakpoint(width) {
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function useWidgetLayout(user) {
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [currentBreakpoint, setCurrentBreakpoint] = useState(() =>
    getCurrentBreakpoint(window.innerWidth)
  );
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false);
  const debouncedSaveRef = useRef(null);

  // Detect breakpoint changes
  useEffect(() => {
    const handleResize = debounce(() => {
      const bp = getCurrentBreakpoint(window.innerWidth);
      setCurrentBreakpoint(bp);
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

 // Load layouts from Supabase
useEffect(() => {
  if (!user) {
    setLayouts(DEFAULT_LAYOUTS);
    hydratedRef.current = false;
    return;
  }

  (async () => {
    try {
      const { data, error } = await supabase
        .from('widget_layouts')
        .select('*')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading layouts:', error);
      }

      if (data && data.length > 0) {
        const loadedLayouts = { ...DEFAULT_LAYOUTS };
        data.forEach(row => {
          if (row.breakpoint && row.layout) {
            loadedLayouts[row.breakpoint] = row.layout;
          }
        });
        setLayouts(loadedLayouts);
      }
    } catch (err) {
      console.error('Error loading layouts:', err);
    } finally {
      setLoading(false);  // Only set false AFTER user data loads, this is to avoid any flash of default layout when refreshed
      hydratedRef.current = true;
    }
  })();
}, [user]);

  // Save layout for specific breakpoint
  const saveLayout = useCallback(
    async (breakpoint, items) => {
      if (!user || !hydratedRef.current) return;

      try {
        const { error } = await supabase
          .from('widget_layouts')
          .upsert(
            {
              user_id: user.id,
              breakpoint,
              layout: items,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,breakpoint',
            }
          );

        if (error) {
          console.error('Error saving layout:', error);
        }
      } catch (err) {
        console.error('Error saving layout:', err);
      }
    },
    [user]
  );

  // Create debounced save function
  useEffect(() => {
    debouncedSaveRef.current = debounce((bp, items) => {
      saveLayout(bp, items);
    }, BOUNCE_TIME);
  }, [saveLayout]);

  // Update layout for current breakpoint
  const updateLayout = useCallback(
    (updatedItems) => {
      setLayouts(prev => ({
        ...prev,
        [currentBreakpoint]: updatedItems,
      }));
      
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current(currentBreakpoint, updatedItems);
      }
    },
    [currentBreakpoint]
  );

  // Reset to default layouts
  const resetLayout = useCallback(async () => {
    setLayouts(DEFAULT_LAYOUTS);
    
    if (!user) return;

    try {
      const { error } = await supabase
        .from('widget_layouts')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting layout:', error);
      }
    } catch (err) {
      console.error('Error resetting layout:', err);
    }
  }, [user]);

  return {
    layout: layouts[currentBreakpoint] || DEFAULT_LAYOUTS.lg,
    allLayouts: layouts,
    currentBreakpoint,
    loading,
    updateLayout,
    resetLayout,
  };
}