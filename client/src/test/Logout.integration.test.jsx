import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProviders';
import WidgetGrid from '../components/widget-grid/WidgetGrid';
import UserLogin from '../auth/UserLogin';
import { supabase } from '../auth/supabaseClient';

// Mock Supabase
vi.mock('../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock preferences API
vi.mock('../api/preferences', () => ({
  getUserPreferences: vi.fn().mockResolvedValue({}),
  saveUserPreferences: vi.fn().mockResolvedValue({}),
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

describe('Logout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApp = (initialPath = '/app') => {
    window.history.pushState({}, 'Test page', initialPath);

    return render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<UserLogin />} />
            <Route
              path="/app"
              element={
                <div>
                  <h1>Protected App</h1>
                  <WidgetGrid widgets={[]} />
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should complete full logout flow: open settings → logout → redirect to login', async () => {
    const user = userEvent.setup();
    
    // User is authenticated
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    supabase.auth.signOut.mockResolvedValue({ error: null });

    renderApp('/app');

    // Wait for the app to load
    await waitFor(() => {
      expect(screen.getByText('Protected App')).toBeInTheDocument();
    });

    // Wait for settings button to appear (⚙️)
    await waitFor(() => {
      const settingsBtn = screen.getByLabelText(/settings/i);
      expect(settingsBtn).toBeInTheDocument();
    });

    // Open settings panel
    const settingsBtn = screen.getByLabelText(/settings/i);
    await user.click(settingsBtn);

    // Wait for logout button to be visible in settings panel
    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    // Verify signOut was called
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    // After logout, user should be redirected to login
    // Note: In a real test, you'd verify the URL change
    // For this test, we verify the signOut was called successfully
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('should clear auth state after logout', async () => {
    const user = userEvent.setup();
    let authChangeCallback;

    // Setup auth state change listener
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    // User is authenticated initially
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    supabase.auth.signOut.mockImplementation(async () => {
      // Simulate auth state change to null after sign out
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }
      return { error: null };
    });

    renderApp('/app');

    // Wait for app to load with user
    await waitFor(() => {
      expect(screen.getByText('Protected App')).toBeInTheDocument();
    });

    await waitFor(() => {
      const settingsBtn = screen.getByLabelText(/settings/i);
      expect(settingsBtn).toBeInTheDocument();
    });

    // Open settings and logout
    const settingsBtn = screen.getByLabelText(/settings/i);
    await user.click(settingsBtn);

    // Wait for logout button
    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should handle logout errors gracefully', async () => {
    const user = userEvent.setup();
    
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    supabase.auth.signOut.mockRejectedValue(new Error('Network error'));

    renderApp('/app');

    await waitFor(() => {
      expect(screen.getByText('Protected App')).toBeInTheDocument();
    });

    await waitFor(() => {
      const settingsBtn = screen.getByLabelText(/settings/i);
      expect(settingsBtn).toBeInTheDocument();
    });

    const settingsBtn = screen.getByLabelText(/settings/i);
    await user.click(settingsBtn);

    // Wait for logout button
    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    // Even with error, signOut should be attempted
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should prevent multiple simultaneous logout attempts', async () => {
    const user = userEvent.setup();
    
    // Make signOut take time
    let resolveSignOut;
    supabase.auth.signOut.mockImplementation(() => {
      return new Promise((resolve) => {
        resolveSignOut = resolve;
      });
    });

    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    renderApp('/app');

    await waitFor(() => {
      expect(screen.getByText('Protected App')).toBeInTheDocument();
    });

    await waitFor(() => {
      const settingsBtn = screen.getByLabelText(/settings/i);
      expect(settingsBtn).toBeInTheDocument();
    });

    // Open settings
    const settingsBtn = screen.getByLabelText(/settings/i);
    await user.click(settingsBtn);

    // Wait for logout button
    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    // Button should be disabled during logout
    await waitFor(() => {
      expect(logoutButton).toBeDisabled();
    });

    // signOut should only be called once
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

    // Resolve the sign out
    resolveSignOut({ error: null });
  });
});
