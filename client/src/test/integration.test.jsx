// tests/integration.test.jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useWidgetLayout from '../hooks/useWidgetLayout';
import { supabase } from '../auth/supabaseClient';

vi.mock('../auth/supabaseClient');

const mockUser = { id: 'test-user' };

// Utility: flush all microtasks + React state updates
const flushAll = async (ms = 0) => {
  await act(async () => {
    if (ms) vi.advanceTimersByTime(ms);
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
  });
};

describe('Integration: Layout Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should fetch user layout on mount and save on change', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({ data: [{ breakpoint: 'lg', layout: [] }], error: null })
    );
    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

    supabase.from = vi.fn(() => ({
      select: () => ({ eq: mockFetch }),
      upsert: mockUpsert,
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalled();

    act(() => {
      result.current.updateLayout([{ id: 'test', col: 0, row: 0, w: 2, h: 2 }]);
    });

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled(), { timeout: 1200 });
  });

  it('should handle unauthorized access (401)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    supabase.from = vi.fn(() => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: null,
            error: { code: '401', message: 'Unauthorized' },
          }),
      }),
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.layout).toBeDefined();
    expect(result.current.layout.length).toBeGreaterThan(0);
    consoleSpy.mockRestore();
  });

  it('should prevent cross-user access (RLS simulation)', async () => {
    const db = new Map();

    supabase.from = vi.fn(() => ({
      select: () => ({
        eq: (field, id) =>
          Promise.resolve({ data: db.get(id) || [], error: null }),
      }),
      upsert: rec => {
        if (rec.user_id) {
          const old = db.get(rec.user_id) || [];
          db.set(rec.user_id, [...old.filter(r => r.breakpoint !== rec.breakpoint), rec]);
        }
        return Promise.resolve({ error: null });
      },
    }));

    const user1 = { id: 'u1' };
    const user2 = { id: 'u2' };

    const { result: r1 } = renderHook(() => useWidgetLayout(user1));
    await waitFor(() => expect(r1.current.loading).toBe(false));

    act(() => {
      r1.current.updateLayout([{ id: 'private', col: 0, row: 0, w: 1, h: 1 }]);
    });
    await waitFor(() => expect(db.get(user1.id)).toBeDefined(), { timeout: 1200 });

    const { result: r2 } = renderHook(() => useWidgetLayout(user2));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    expect(db.get(user2.id)).toBeUndefined();
    expect(r2.current.layout).not.toEqual(r1.current.layout);
  });

  it('should persist layout changes to Supabase', async () => {
    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: mockUpsert,
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateLayout([{ id: 'widget1', col: 0, row: 0, w: 2, h: 2 }]);
    });

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled(), { timeout: 1200 });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        layout: expect.any(Array),
      }),
      expect.any(Object)
    );
  });

  it('should handle network errors during save', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: () => Promise.reject(new Error('Network error')),
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateLayout([{ id: 'w1', col: 0, row: 0, w: 2, h: 2 }]);
    });

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled(), { timeout: 1200 });
    consoleSpy.mockRestore();
  });

  it('should debounce multiple rapid layout updates', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: mockUpsert,
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateLayout([{ id: 'w1', col: 0, row: 0, w: 1, h: 1 }]);
      result.current.updateLayout([{ id: 'w2', col: 1, row: 1, w: 2, h: 2 }]);
      result.current.updateLayout([{ id: 'w3', col: 2, row: 2, w: 3, h: 3 }]);
    });

    await flushAll(1200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should handle responsive breakpoint changes', async () => {
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: () => Promise.resolve({ error: null }),
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initial = result.current.currentBreakpoint;
    expect(['lg', 'md', 'sm', 'xs']).toContain(initial);

    // Verify breakpoint is valid
    expect(result.current.currentBreakpoint).toBeDefined();
  });

  it('should load default layout when no saved data', async () => {
    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: () => Promise.resolve({ error: null }),
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.layout).toBeDefined();
    expect(result.current.layout.length).toBeGreaterThan(0);
    expect(result.current.layout.some(item => item.id === 'weather')).toBe(true);
  });

  it('should reset layout and clear from database', async () => {
    const mockDelete = vi.fn(() => ({ 
      eq: vi.fn(() => Promise.resolve({ error: null })) 
    }));

    supabase.from = vi.fn(() => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      delete: mockDelete,
    }));

    const { result } = renderHook(() => useWidgetLayout(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.resetLayout();
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(result.current.layout).toBeDefined();
  });
});