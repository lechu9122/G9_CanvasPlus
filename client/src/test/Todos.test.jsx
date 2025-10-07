import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../api/todos';
import { supabase } from '../auth/supabaseClient';

// Mock supabase
vi.mock('../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Todos API', () => {
  const mockUser = { id: 'user-123' };
  const mockTodo = {
    id: 'todo-1',
    user_id: 'user-123',
    title: 'Test Todo',
    description: 'Test description',
    due_date: '2024-12-31T00:00:00Z',
    class: 'CS101',
    done: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodos', () => {
    it('should fetch todos for authenticated user', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockTodo],
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await getTodos();

      expect(result.data).toEqual([mockTodo]);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('todos');
      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockFrom.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return error when user is not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getTodos();

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('not authenticated');
    });

    it('should handle fetch errors from supabase', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockError = new Error('Network error');
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await getTodos();

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('createTodo', () => {
    it('should create a new todo with all fields', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTodo,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const todoData = {
        title: 'Test Todo',
        description: 'Test description',
        due_date: '2024-12-31T00:00:00Z',
        class: 'CS101',
      };

      const result = await createTodo(todoData);

      expect(result.data).toEqual(mockTodo);
      expect(result.error).toBeNull();
      expect(mockFrom.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: mockUser.id,
          title: todoData.title,
          description: todoData.description,
          due_date: todoData.due_date,
          class: todoData.class,
          done: false,
        }),
      ]);
    });

    it('should handle missing optional fields', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTodo, description: null, due_date: null, class: null },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await createTodo({ title: 'Test' });

      expect(result.error).toBeNull();
      expect(mockFrom.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Test',
          description: null,
          due_date: null,
          class: null,
        }),
      ]);
    });

    it('should return error when user is not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await createTodo({ title: 'Test' });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('not authenticated');
    });

    it('should handle create errors from supabase', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockError = new Error('Insert failed');
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await createTodo({ title: 'Test' });

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const updatedTodo = { ...mockTodo, done: true };
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedTodo,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await updateTodo('todo-1', { done: true });

      expect(result.data.done).toBe(true);
      expect(result.error).toBeNull();
      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          done: true,
          updated_at: expect.any(String),
        })
      );
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'todo-1');
    });

    it('should update multiple fields', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTodo, title: 'Updated', description: 'New desc' },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      await updateTodo('todo-1', { title: 'Updated', description: 'New desc' });

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated',
          description: 'New desc',
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle update errors from supabase', async () => {
      const mockError = new Error('Update failed');
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await updateTodo('todo-1', { done: true });

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError);
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await deleteTodo('todo-1');

      expect(result.data).toEqual({ id: 'todo-1' });
      expect(result.error).toBeNull();
      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'todo-1');
    });

    it('should handle delete errors from supabase', async () => {
      const mockError = new Error('Delete failed');
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await deleteTodo('todo-1');

      expect(result.data).toEqual({ id: 'todo-1' });
      expect(result.error).toBe(mockError);
    });
  });
});