import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TodoWidget from '../components/TodoWidget';
import * as todosApi from '../api/todos';
import "@testing-library/jest-dom/vitest";

// Mock the todos API
vi.mock('../api/todos');

describe('TodoWidget', () => {
  const mockTodos = [
    {
      id: '1',
      user_id: 'user-123',
      title: 'Complete assignment',
      description: 'Math homework',
      due_date: '2024-12-25T10:00:00Z',
      class: 'MATH101',
      done: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      title: 'Study for exam',
      description: null,
      due_date: '2024-12-30T14:00:00Z',
      class: 'CS310',
      done: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    todosApi.getTodos.mockResolvedValue({ data: mockTodos, error: null });
    todosApi.createTodo.mockResolvedValue({ data: mockTodos[0], error: null });
    todosApi.updateTodo.mockResolvedValue({ data: mockTodos[0], error: null });
    todosApi.deleteTodo.mockResolvedValue({ data: { id: '1' }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Add button and time filter (no categories)', async () => {
    render(<TodoWidget />);
    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    expect(screen.getByText('All Dates')).toBeInTheDocument();
    expect(screen.queryByText('All Courses')).not.toBeInTheDocument();
  });

  it('can open and close the add modal (rendered via portal)', async () => {
    render(<TodoWidget />);
    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Add New Task')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Close'));
    await waitFor(() => expect(screen.queryByText('Add New Task')).not.toBeInTheDocument());
  });

  it('fetches and displays todos from API', async () => {
    render(<TodoWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Study for exam')).toBeInTheDocument();
    expect(todosApi.getTodos).toHaveBeenCalledTimes(1);
  });

  it('can add a new todo with description and class', async () => {
    const newTodo = {
      id: '3',
      user_id: 'user-123',
      title: 'Test Task',
      description: 'Some details',
      due_date: null,
      class: 'SOFTENG 310',
      done: false,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };

    todosApi.createTodo.mockResolvedValue({ data: newTodo, error: null });

    render(<TodoWidget />);
    
    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Add'));
    fireEvent.change(screen.getByPlaceholderText('Task title...'), { target: { value: 'Test Task' } });
    fireEvent.change(screen.getByPlaceholderText('Optional details...'), { target: { value: 'Some details' } });
    fireEvent.change(screen.getByPlaceholderText('Class (optional)...'), { target: { value: 'SOFTENG 310' } });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(todosApi.createTodo).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Some details',
        due_date: null,
        class: 'SOFTENG 310',
      });
    });

    await waitFor(() => expect(screen.getByText('Test Task')).toBeInTheDocument());
  });

  it('clicking the check toggles done/undone', async () => {
    render(<TodoWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });

    // Find the checkbox for the incomplete todo
    const checkboxes = screen.getAllByRole('checkbox');
    const incompleteCheckbox = checkboxes.find(
      (cb) => cb.getAttribute('aria-checked') === 'false'
    );

    expect(incompleteCheckbox).toBeInTheDocument();

    // Click to mark as done
    fireEvent.click(incompleteCheckbox);

    await waitFor(() => {
      expect(todosApi.updateTodo).toHaveBeenCalledWith('1', { done: true });
    });
  });

  it('delete works', async () => {
    render(<TodoWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });

    // Find delete buttons
    const deleteButtons = screen.getAllByTitle('Delete task');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(todosApi.deleteTodo).toHaveBeenCalledWith('1');
    });

    // Todo should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Complete assignment')).not.toBeInTheDocument();
    });
  });

  it('displays error when fetch fails', async () => {
    todosApi.getTodos.mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    render(<TodoWidget />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  it('displays error when create fails', async () => {
    todosApi.createTodo.mockResolvedValue({
      data: null,
      error: new Error('Failed to create'),
    });

    render(<TodoWidget />);

    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());

    // Open modal and submit
    fireEvent.click(screen.getByText('Add'));
    fireEvent.change(screen.getByPlaceholderText('Task title...'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create todo/i)).toBeInTheDocument();
    });
  });

  it('reverts state when update fails', async () => {
    todosApi.updateTodo.mockResolvedValue({
      data: null,
      error: new Error('Update failed'),
    });

    render(<TodoWidget />);

    await waitFor(() => {
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const incompleteCheckbox = checkboxes.find(
      (cb) => cb.getAttribute('aria-checked') === 'false'
    );

    fireEvent.click(incompleteCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update todo/i)).toBeInTheDocument();
    });
  });

  it('reloads todos when delete fails', async () => {
    todosApi.getTodos
      .mockResolvedValueOnce({ data: mockTodos, error: null })
      .mockResolvedValueOnce({ data: mockTodos, error: null });
    
    todosApi.deleteTodo.mockResolvedValue({
      data: null,
      error: new Error('Delete failed'),
    });

    render(<TodoWidget />);

    await waitFor(() => {
      expect(screen.getByText('Complete assignment')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete task');
    fireEvent.click(deleteButtons[0]);

    // Should call getTodos again to reload (total of 2 calls)
    await waitFor(() => {
      expect(todosApi.getTodos).toHaveBeenCalledTimes(2);
    });

    // Item should still be in the list after reload
    expect(screen.getByText('Complete assignment')).toBeInTheDocument();
  });
});
