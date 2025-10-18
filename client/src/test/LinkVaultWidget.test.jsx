import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LinkVaultWidget from '../components/LinkVaultWidget';
import { supabase } from '../auth/supabaseClient';

// Mock Supabase client
vi.mock('../auth/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('LinkVaultWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------
  // BASIC RENDER TESTS
  // -------------------------
  test('renders "Link Vault" title when user is logged in', async () => {
  // Simulate a logged-in user
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

  // Mock supabase.from().select() chain
  const fromMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [] }),
  };
  supabase.from.mockReturnValue(fromMock);

  render(<LinkVaultWidget />);

  // Now it should show the main UI with the header
  expect(await screen.findByText('Link Vault')).toBeInTheDocument();
});

  test('shows login message if no user is authenticated', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    render(<LinkVaultWidget />);
    expect(await screen.findByText('Please log in to manage your links.')).toBeInTheDocument();
  });

  // -------------------------
  // FETCH LINKS TESTS
  // -------------------------
  test('fetches and displays links when user is logged in', async () => {
    const mockLinks = [
      { id: 1, user_id: 'u1', title: 'Google', url: 'https://google.com', tags: ['search'], created_at: new Date().toISOString() },
      { id: 2, user_id: 'u1', title: 'GitHub', url: 'https://github.com', tags: ['code'], created_at: new Date().toISOString() },
    ];

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLinks }),
    };
    supabase.from.mockReturnValue(fromMock);

    render(<LinkVaultWidget />);

    expect(await screen.findByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('2 links')).toBeInTheDocument();
  });

  test('handles fetchLinks error gracefully', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed to fetch') }),
    };
    supabase.from.mockReturnValue(fromMock);

    render(<LinkVaultWidget />);
    expect(await screen.findByText('Link Vault')).toBeInTheDocument();
  });

  // -------------------------
  // ADD LINK MODAL
  // -------------------------
  test('opens Add Link modal when button clicked', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    };
    supabase.from.mockReturnValue(fromMock);

    render(<LinkVaultWidget />);
    await waitFor(() => screen.getByText('+ Add Link'));
    fireEvent.click(screen.getByText('+ Add Link'));
    expect(screen.getByText('Add New Link')).toBeInTheDocument();
  });

  test('Add Link button is disabled when URL is empty', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    };
    supabase.from.mockReturnValue(fromMock);

    render(<LinkVaultWidget />);
    await waitFor(() => screen.getByText('+ Add Link'));
    fireEvent.click(screen.getByText('+ Add Link'));
    const addButton = screen.getByRole('button', { name: 'Add Link' });
    expect(addButton).toBeDisabled();
  });

  test('calls supabase.insert when adding a new link', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [{ id: 10, title: 'New', url: 'https://test.com', tags: [] }] }) });
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      insert: mockInsert,
    };
    supabase.from.mockReturnValue(fromMock);

    render(<LinkVaultWidget />);
    await waitFor(() => screen.getByText('+ Add Link'));
    fireEvent.click(screen.getByText('+ Add Link'));

    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'https://test.com' } });

    const addButton = screen.getByRole('button', { name: 'Add Link' });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});