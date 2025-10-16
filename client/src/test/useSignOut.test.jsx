import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useSignOut } from '../hooks/useSignOut';
import { supabase } from '../auth/supabaseClient';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSignOut(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should successfully sign out user', async () => {
    // Mock successful sign-out
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignOut(), { wrapper });

    // Call signOut
    await result.current.signOut();

    await waitFor(() => {
      // Verify Supabase signOut was called with correct scope
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      
      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        'Successfully logged out',
        expect.objectContaining({
          duration: 2000,
          position: 'top-center',
        })
      );

      // Verify navigation to login
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });

      // Verify loading state is reset
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle sign-out errors gracefully', async () => {
    // Mock sign-out error
    const mockError = new Error('Network error');
    supabase.auth.signOut.mockResolvedValue({ error: mockError });

    const { result } = renderHook(() => useSignOut(), { wrapper });

    await result.current.signOut();

    await waitFor(() => {
      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith(
        'Sign-out failed. Please try again.',
        expect.objectContaining({
          duration: 4000,
          position: 'top-center',
        })
      );

      // Verify error state is set
      expect(result.current.error).toBe('Network error');

      // Verify loading state is reset
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should set loading state during sign-out', async () => {
    let resolveSignOut;
    const signOutPromise = new Promise((resolve) => {
      resolveSignOut = resolve;
    });

    supabase.auth.signOut.mockReturnValue(signOutPromise);

    const { result } = renderHook(() => useSignOut(), { wrapper });

    // Start sign-out
    result.current.signOut();

    await waitFor(() => {
      // Verify loading state is true during sign-out
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve sign-out
    resolveSignOut({ error: null });

    await waitFor(() => {
      // Verify loading state is false after sign-out
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should redirect even on invalid session error', async () => {
    // Mock session error
    const mockError = new Error('Invalid session');
    supabase.auth.signOut.mockRejectedValue(mockError);

    const { result } = renderHook(() => useSignOut(), { wrapper });

    await result.current.signOut();

    await waitFor(() => {
      // Verify navigation still happens for invalid session
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should clear error state on new sign-out attempt', async () => {
    // First sign-out fails
    supabase.auth.signOut.mockRejectedValue(new Error('First error'));
    const { result } = renderHook(() => useSignOut(), { wrapper });

    await result.current.signOut();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Second sign-out succeeds
    supabase.auth.signOut.mockResolvedValue({ error: null });
    await result.current.signOut();

    await waitFor(() => {
      // Verify error is cleared
      expect(result.current.error).toBe(null);
    });
  });
});
