import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotesWidget from '../components/NotesWidget';

// Mock the supabase client - everything must be inside the factory
vi.mock('../auth/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn()
    }
  };
});

describe('NotesWidget - Core Functionality', () => {
  let supabase;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked supabase
    const module = await import('../auth/supabaseClient');
    supabase = module.supabase;
    
    // Setup default mock implementations
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [{ id: '1', content: 'Test note', user_id: 'user1', created_at: new Date().toISOString() }], 
          error: null 
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    });
  });

  // ============================================================================
  // TESTS FOR NOT LOGGED IN USER
  // ============================================================================
  
  describe('Creating notes when not logged in', () => {
    beforeEach(() => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    });

    it('should not allow note creation when user is not logged in', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByText('Please log in to use notes')).toBeInTheDocument();
      });

      // Should not have textarea or save button
      expect(screen.queryByPlaceholderText('Type here… (Ctrl+Enter to save)')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save Note' })).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TESTS FOR CREATING NOTES (LOGGED IN USER)
  // ============================================================================

  describe('Creating notes when logged in', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };

    beforeEach(() => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('should create note with valid input and clear textarea', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)');
      const saveButton = screen.getByRole('button', { name: 'Save Note' });

      // Input text and save
      fireEvent.change(textarea, { target: { value: 'My test note' } });
      fireEvent.click(saveButton);

      // Verify supabase insert was called with correct data
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('Notes');
        expect(supabase.from().insert).toHaveBeenCalledWith([{
          user_id: 'user1',
          content: 'My test note'
        }]);
      });

      // Verify textarea is cleared after save
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should not create note with empty or whitespace-only input', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Note' })).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)');
      const saveButton = screen.getByRole('button', { name: 'Save Note' });

      // Test empty input
      expect(saveButton).toBeDisabled();

      // Test whitespace-only input
      fireEvent.change(textarea, { target: { value: '   \n\t  ' } });
      expect(saveButton).toBeDisabled();

      // Verify no database call was made
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should trim whitespace from note content before saving', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)');
      const saveButton = screen.getByRole('button', { name: 'Save Note' });

      // Input text with surrounding whitespace
      fireEvent.change(textarea, { target: { value: '  \n  My note with whitespace  \n  ' } });
      fireEvent.click(saveButton);

      // Verify trimmed content was saved
      await waitFor(() => {
        expect(supabase.from().insert).toHaveBeenCalledWith([{
          user_id: 'user1',
          content: 'My note with whitespace'
        }]);
      });
    });
  });

  // ============================================================================
  // TESTS FOR EDITING NOTES (LOGGED IN USER)
  // ============================================================================

  describe('Editing notes when logged in', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockNote = {
      id: '1',
      content: 'Original content',
      user_id: 'user1',
      created_at: '2024-01-01T10:00:00.000Z'
    };

    beforeEach(() => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      // Override the default mock to return our test note
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [mockNote], error: null }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });
    });

    it('should update note with new content when edited', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: 'Edit' });
      fireEvent.click(editButton);

      // Modify content and save
      const textarea = screen.getByDisplayValue('Original content');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Verify update was called with correct data
      await waitFor(() => {
        expect(supabase.from().update).toHaveBeenCalledWith({
          content: 'Updated content',
          updated_at: expect.any(String)
        });
      });
    });

    it('should not update note with empty content', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      });

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: 'Edit' });
      fireEvent.click(editButton);

      // Clear content
      const textarea = screen.getByDisplayValue('Original content');
      fireEvent.change(textarea, { target: { value: '' } });

      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();

      // Verify no update call was made
      expect(supabase.from().update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TESTS FOR DELETING NOTES (LOGGED IN USER)  
  // ============================================================================

  describe('Deleting notes when logged in', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockNote = {
      id: '1',
      content: 'Note to delete',
      user_id: 'user1',
      created_at: '2024-01-01T10:00:00.000Z'
    };

    beforeEach(() => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      // Override the default mock to return our test note
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [mockNote], error: null }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });
    });

    it('should delete note when delete button is clicked', async () => {
      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      // Verify delete was called
      await waitFor(() => {
        expect(supabase.from().delete).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // TESTS FOR ERROR HANDLING
  // ============================================================================

  describe('Error handling for storage operations', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };

    beforeEach(() => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      console.error = vi.fn(); // Mock console.error
    });

    it('should handle insert error gracefully', async () => {
      // Override mock to return error
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Insert failed' } }))
        }))
      });

      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Type here… (Ctrl+Enter to save)');
      const saveButton = screen.getByRole('button', { name: 'Save Note' });

      fireEvent.change(textarea, { target: { value: 'Test note' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error saving note:', { message: 'Insert failed' });
      });
    });

    it('should handle update error gracefully', async () => {
      const mockNote = {
        id: '1',
        content: 'Original content',
        user_id: 'user1',
        created_at: '2024-01-01T10:00:00.000Z'
      };

      // Override mock to return error on update
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [mockNote], error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: 'Update failed' } }))
        }))
      });

      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit' });
      fireEvent.click(editButton);

      const textarea = screen.getByDisplayValue('Original content');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error updating note:', { message: 'Update failed' });
      });
    });

    it('should handle delete error gracefully', async () => {
      const mockNote = {
        id: '1',
        content: 'Note to delete',
        user_id: 'user1',
        created_at: '2024-01-01T10:00:00.000Z'
      };

      // Override mock to return error on delete
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [mockNote], error: null }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: 'Delete failed' } }))
        }))
      });

      render(<NotesWidget />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error deleting note:', { message: 'Delete failed' });
      });
    });
  });
});