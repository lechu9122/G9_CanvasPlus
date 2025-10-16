// tests/useWidgetLayout.test.jsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useWidgetLayout from '../hooks/useWidgetLayout';
import { supabase } from '../auth/supabaseClient';

// Mock Supabase
vi.mock('../auth/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('useWidgetLayout', () => {
  const mockUser = { id: 'user123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('should load saved layout from Supabase', async () => {
    const savedLayout = [
      { id: 'weather', title: 'Weather', col: 0, row: 0, w: 2, h: 2, minW: 2, minH: 2 }
    ];
    
    supabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: [{ breakpoint: 'md', layout: savedLayout }], 
          error: null 
        }))
      }))
    });

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check the 'md' breakpoint layout was loaded
    expect(result.current.allLayouts.md).toEqual(savedLayout);
  });

  it('should save layout to Supabase on update', async () => {
    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
    
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: mockUpsert
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newLayout = [
      { id: 'clock', col: 1, row: 1, w: 3, h: 2 }
    ];

    act(() => {
      result.current.updateLayout(newLayout);
    });

    // Wait for debounce (BOUNCE_TIME = 800ms)
    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
    }, { timeout: 1200 });
  });

  it('should reset layout and delete from Supabase', async () => {
    const mockDelete = vi.fn(() => ({ 
      eq: vi.fn(() => Promise.resolve({ error: null })) 
    }));
    
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      delete: mockDelete
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.resetLayout();
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  it('should handle breakpoint changes', async () => {
    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.currentBreakpoint).toBeDefined();
    expect(['lg', 'md', 'sm', 'xs']).toContain(result.current.currentBreakpoint);
  });

  it('should not save before hydration', async () => {
    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
    
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: mockUpsert
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    // Try to update immediately before hydration completes
    act(() => {
      result.current.updateLayout([{ id: 'test', col: 0, row: 0, w: 2, h: 2 }]);
    });

    // Should not call upsert before hydration
    expect(mockUpsert).not.toHaveBeenCalled();
    
    // Wait for hydration
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle Supabase errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    supabase.from = vi.fn(() => ({
      select: () => ({ 
        eq: () => Promise.resolve({ 
          data: null, 
          error: { message: 'Database error' } 
        }) 
      })
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should fall back to default layout on error
    expect(result.current.layout).toBeDefined();
    expect(result.current.layout.length).toBeGreaterThan(0);
    
    consoleErrorSpy.mockRestore();
  });

  it('should update layout for current breakpoint only', async () => {
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: () => Promise.resolve({ error: null })
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const currentBp = result.current.currentBreakpoint;
    const newLayout = [{ id: 'test', col: 0, row: 0, w: 2, h: 2 }];
    
    act(() => {
      result.current.updateLayout(newLayout);
    });

    // Check that only current breakpoint was updated
    expect(result.current.allLayouts[currentBp]).toEqual(newLayout);
  });
});