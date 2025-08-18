import { useEffect, useState } from "react";

// Google OAuth Client ID (from Google Cloud Console, Web App type)
const CLIENT_ID = "732897444427-h0p9benc1pvhg587fsmjjkco85kh4dkn.apps.googleusercontent.com";
// Scope defines what level of access we want (read-only Calendar in this case)
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// Helper to dynamically load a script (Google Identity Services SDK)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // If script already exists, just resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();      // Resolve when loaded
    s.onerror = (e) => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);    // Add script tag to document
  });
}

export default function useGoogleCalendarEvents({ maxResults = 10, timeMin = new Date() } = {}) {
  // React state hooks for events, loading state, errors, and auth prompt
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Key used to save tokens in sessionStorage
  const TOKEN_KEY = 'gcal_access_token';

  useEffect(() => {
    let mounted = true; // flag to avoid updating state after unmount

    async function init() {
      try {
        // Load the Google Identity Services library
        await loadScript('https://accounts.google.com/gsi/client');

        // Check if library is available
        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
          throw new Error('Google Identity Services not available');
        }

        // Initialize a token client to request OAuth tokens
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
        });

        // Wrap token requests in a Promise for async/await use
        const requestToken = (opts = {}) => new Promise((resolve, reject) => {
          try {
            tokenClient.callback = (resp) => {
              if (resp && resp.access_token) resolve(resp); // success
              else reject(resp || new Error('No token received'));
            };
            tokenClient.requestAccessToken(opts); // request token
          } catch (e) { reject(e); }
        });

        // Try to use a saved token from sessionStorage if it’s still valid
        const saved = sessionStorage.getItem(TOKEN_KEY);
        let tokenResp = null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.access_token && parsed.expires_at && parsed.expires_at > Date.now()) {
              tokenResp = parsed; // reuse existing token
            }
          } catch (e) { /* ignore parse errors */ }
        }

        // If no valid token, try silent login (prompt: 'none')
        if (!tokenResp) {
          try {
            tokenResp = await requestToken({ prompt: 'none' });
          } catch (e) {
            // Silent login failed → need interactive sign-in
            setNeedsAuth(true);
            setLoading(false);
            return;
          }
        }

        if (!mounted) return;
        const accessToken = tokenResp.access_token;
        if (!accessToken) throw new Error('No access token returned');

        // Build query parameters for the Calendar API request
        const params = new URLSearchParams({
          timeMin: new Date(timeMin).toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: String(maxResults),
        });

        // Fetch events from the Google Calendar API
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // Handle errors from API
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Calendar API error ${res.status}: ${body}`);
        }

        // Parse response JSON and update state
        const data = await res.json();
        if (!mounted) return;
        setEvents(data.items || []);

        // Save token back to sessionStorage with expiry
        try {
          const expiresIn = tokenResp.expires_in || tokenResp.expiresAt || null;
          const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (60 * 60 * 1000);
          sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
            access_token: accessToken,
            expires_at: expiresAt
          }));
        } catch (e) { /* ignore storage errors */ }
      } catch (e) {
        if (!mounted) return;
        // Normalize error into readable string
        let msg;
        try {
          if (e instanceof Error) msg = e.message;
          else if (typeof e === 'string') msg = e;
          else msg = JSON.stringify(e);
        } catch (err) { msg = String(e); }
        setError(msg || 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; }; // cleanup
  }, [maxResults, timeMin]);

  // Function to trigger interactive sign-in
  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure script is loaded
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        await loadScript('https://accounts.google.com/gsi/client');
      }

      // Create token client for interactive sign-in
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES
      });

      const requestToken = (opts = {}) => new Promise((resolve, reject) => {
        try {
          tokenClient.callback = (resp) => {
            if (resp && resp.access_token) resolve(resp);
            else reject(resp || new Error('No token'));
          };
          tokenClient.requestAccessToken(opts);
        } catch (e) { reject(e); }
      });

      // This time we allow prompting → will show Google login UI
      const tokenResp = await requestToken({ prompt: '' });
      if (!tokenResp || !tokenResp.access_token) throw new Error('Sign-in failed');

      // Save token and expiry
      const expiresIn = tokenResp.expires_in || null;
      const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (60*60*1000);
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
        access_token: tokenResp.access_token,
        expires_at: expiresAt
      }));

      setNeedsAuth(false);

      // Immediately fetch events again
      try {
        const params = new URLSearchParams({
          timeMin: new Date(timeMin).toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: String(maxResults)
        });
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
          { headers: { Authorization: `Bearer ${tokenResp.access_token}` } }
        );
        if (!res.ok) throw new Error('Calendar fetch failed: ' + res.status);
        const data = await res.json();
        setEvents(data.items || []);
      } catch (e) {
        setError(e.message || String(e));
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Hook returns events, loading status, error messages,
  // whether user needs to sign in, and a signIn() function
  return { events, loading, error, needsAuth, signIn };
}
