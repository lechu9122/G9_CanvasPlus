import React from 'react';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CalendarWidget from '../components/CalendarWidget.jsx';
import useGoogleCalendarEvents from '../hooks/useGoogleCalendarEvents.js';

// Hook probe component
function HookProbe(props) {
  const state = useGoogleCalendarEvents(props);
  return (
    <div data-testid="hook-probe">
      <div data-testid="loading">{String(state.loading)}</div>
      <div data-testid="needsAuth">{String(state.needsAuth)}</div>
      <div data-testid="error">{state.error || ''}</div>
      <div data-testid="events">{JSON.stringify(state.events)}</div>
      <button onClick={state.signIn}>signIn</button>
    </div>
  );
}

function mockGoogleIdentity({ token = 'abc123', failToken = false } = {}) {
  const origCreate = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreate.call(document, tag);
    if (tag === 'script') setTimeout(() => el.onload && el.onload());
    return el;
  });
  window.google = {
    accounts: {
      oauth2: {
        initTokenClient: () => {
          const client = {
            callback: null,
            requestAccessToken: () => {
              setTimeout(() => {
                if (client.callback) {
                  if (failToken) client.callback({ error: 'denied' });
                  else client.callback({ access_token: token, expires_in: 3600 });
                }
              });
            }
          };
          return client;
        }
      }
    }
  };
}

function clearMocks() {
  vi.restoreAllMocks();
  delete window.google;
  sessionStorage.clear();
  if (global.fetch) delete global.fetch;
}

afterEach(() => cleanup());

// Hook tests
describe('useGoogleCalendarEvents (hook)', () => {
  beforeEach(() => clearMocks());
  afterEach(() => clearMocks());

  // Tests init() inside useEffect: no cached token branch sets needsAuth=true and stops loading
  it('sets needsAuth=true when there is no cached token', async () => {
    mockGoogleIdentity();
    render(<HookProbe maxResults={5} />);
    await waitFor(() => {
      const loadFlags = screen.getAllByTestId('loading').map(n => n.textContent);
      if (!loadFlags.every(f => f === 'false')) throw new Error('still loading');
    });
    const needsAuthVals = screen.getAllByTestId('needsAuth').map(n => n.textContent);
    expect(needsAuthVals.includes('true')).toBe(true);
  });

  // Tests init() cached token reuse path: uses stored token to fetch events without triggering signIn
  it('uses cached token to fetch events', async () => {
    mockGoogleIdentity();
    const fakeEvents = [{ id: '1', summary: 'Event A' }, { id: '2', summary: 'Event B' }];
    sessionStorage.setItem('gcal_access_token', JSON.stringify({ access_token: 'abc123', expires_at: Date.now() + 60_000 }));
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ items: fakeEvents }) }));
    render(<HookProbe maxResults={5} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const allEventsText = screen.getAllByTestId('events').map(n => n.textContent).join('\n');
    expect(allEventsText).toContain('Event A');
    expect(allEventsText).toContain('Event B');
  });

  // Tests init() fetch error handling: API non-OK path sets human-readable error via setError
  it('sets error on fetch failure', async () => {
    mockGoogleIdentity();
    sessionStorage.setItem('gcal_access_token', JSON.stringify({ access_token: 'bad', expires_at: Date.now() + 60_000 }));
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'Boom' }));
    render(<HookProbe />);
    await waitFor(() => {
      const loadingFlags = screen.getAllByTestId('loading').map(n => n.textContent);
      if (loadingFlags.some(f => f !== 'false')) throw new Error('loading');
    });
    const errorJoined = screen.getAllByTestId('error').map(n => n.textContent).join('\n');
    expect(errorJoined).toMatch(/Calendar API error 500/i);
  });

  // Tests signIn() function: interactive token acquisition then refetch events & flip needsAuth to false
  it('signIn flow obtains token then fetches events', async () => {
    mockGoogleIdentity();
    const fakeEvents = [{ id: 'x', summary: 'Signed In Event' }];
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ items: fakeEvents }) }));
    render(<HookProbe />);
    await waitFor(() => {
      if (!screen.getAllByTestId('needsAuth').some(n => n.textContent === 'true')) throw new Error('no auth yet');
    });
    await act(async () => { screen.getAllByText('signIn')[0].click(); });
    await waitFor(() => {
      const combined = screen.getAllByTestId('events').map(n => n.textContent).join('\n');
      if (!combined.includes('Signed In Event')) throw new Error('no events yet');
    });
    const needsAuthAfter = screen.getAllByTestId('needsAuth').map(n => n.textContent);
    expect(needsAuthAfter.includes('false')).toBe(true);
  });
});

// Widget integration tests
describe('CalendarWidget (integration)', () => {
  beforeEach(() => clearMocks());
  afterEach(() => clearMocks());

  // Simple env sanity: ensure VITE_GOOGLE_CLIENT_ID is exposed (non-empty string) so widget auth can work
  it('env provides Google client ID', () => {
    // This checks our .env / build injection; tests relying on signIn assume a value exists
    expect(typeof import.meta.env.VITE_GOOGLE_CLIENT_ID).toBe('string');
  });

  // Integration: verifies hook init() no-token branch surfaces sign-in prompt through CalendarWidget UI
  it('shows sign-in prompt when no cached token exists', async () => {
    mockGoogleIdentity();
    render(<CalendarWidget />);
    await waitFor(() => screen.getByText(/Sign in to view/i));
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeDefined();
  });

  // Integration: verifies cached token path auto-fetches events and suppresses sign-in prompt
  it('renders events using cached token without prompting', async () => {
    mockGoogleIdentity();
    const events = [{ id: '1', summary: 'Cached Meeting', start: { date: '2025-08-23' } }];
    sessionStorage.setItem('gcal_access_token', JSON.stringify({ access_token: 'abc123', expires_at: Date.now() + 60_000 }));
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ items: events }) }));
    render(<CalendarWidget />);
    await waitFor(() => screen.getByText(/Cached Meeting/));
    expect(global.fetch).toHaveBeenCalled();
    expect(screen.queryByText(/Sign in to view/i)).toBeNull();
  });

  // Integration: verifies signIn() interactive flow triggers token + event rendering in UI
  it('sign-in flow loads events after user interaction', async () => {
    mockGoogleIdentity();
    const events = [{ id: '2', summary: 'Signed In Event', start: { dateTime: new Date().toISOString() } }];
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ items: events }) }));
    render(<CalendarWidget />);
    await waitFor(() => screen.getByRole('button', { name: /Sign in with Google/i }));
    await act(async () => { screen.getByRole('button', { name: /Sign in with Google/i }).click(); });
    await waitFor(() => screen.getByText(/Signed In Event/));
    expect(global.fetch).toHaveBeenCalled();
  });

  // Integration: verifies error propagation from hook init()/fetch to widget UI
  it('shows error when API request fails', async () => {
    mockGoogleIdentity();
    sessionStorage.setItem('gcal_access_token', JSON.stringify({ access_token: 'abc123', expires_at: Date.now() + 60_000 }));
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'Boom' }));
    render(<CalendarWidget />);
    await waitFor(() => screen.getByText(/Error:/i));
    expect(screen.getByText(/500/i)).toBeDefined();
  });
});
