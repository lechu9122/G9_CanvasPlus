import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../auth/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling user sign-out
 * 
 * Provides a secure sign-out flow that:
 * - Calls Supabase auth.signOut()
 * - Manages loading and error states
 * - Shows user feedback via toast notifications
 * - Redirects to login page on success
 * - Clears local state even if remote sign-out fails
 * 
 * @returns {Object} { signOut, isLoading, error }
 */
export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign out from Supabase (scope: 'local' clears session locally)
      const { error: signOutError } = await supabase.auth.signOut({ 
        scope: 'local' 
      });

      if (signOutError) {
        throw signOutError;
      }

      // Clear any persisted data (localStorage, sessionStorage)
      // You can add custom cleanup here, e.g.:
      // localStorage.removeItem('userPreferences');
      // sessionStorage.clear();

      // Show success message
      toast.success('Successfully logged out', {
        duration: 2000,
        position: 'top-center',
      });

      // Redirect to login page
      navigate('/login', { replace: true });

    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err.message || 'Failed to sign out');
      
      // Show error toast
      toast.error('Sign-out failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });

      // Even on error, try to clear local state and redirect
      // This handles cases where the session is already invalid
      if (err.message?.includes('session') || err.message?.includes('invalid')) {
        navigate('/login', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { signOut, isLoading, error };
}
