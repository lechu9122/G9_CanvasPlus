
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import TodoWidget from '../components/TodoWidget';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import "@testing-library/jest-dom/vitest";

const mockTodos = [
  {
    id: 1,
    title: 'Assignment 1',
    course: 'SOFTENG 310',
    dueDate: '2025-08-25T23:59:00Z',
  },
  {
    id: 2,
    title: 'Lab 2',
    course: 'SOFTENG 306',
    dueDate: '2025-08-22T17:00:00Z',
  },
];

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTodos),
    })
  );
});

describe('TodoWidget', () => {
  it('renders Add button and dropdowns', async () => {
    const { container } = render(<TodoWidget />);
    const utils = within(container);
    await waitFor(() => expect(utils.getByText('Add')).toBeInTheDocument());
    expect(utils.getByText('All Courses')).toBeInTheDocument();
    expect(utils.getByText('All Dates')).toBeInTheDocument();
  });

  it('can open and close the add modal', async () => {
    const { container } = render(<TodoWidget />);
    const utils = within(container);
    await waitFor(() => expect(utils.getByText('Add')).toBeInTheDocument());
    fireEvent.click(utils.getByText('Add'));
    expect(utils.getByText('Add New Task')).toBeInTheDocument();
    fireEvent.click(utils.getByTitle('Close'));
    expect(utils.queryByText('Add New Task')).not.toBeInTheDocument();
  });

  it('can add a new todo', async () => {
    const { container } = render(<TodoWidget />);
    const utils = within(container);
    await waitFor(() => expect(utils.getByText('Add')).toBeInTheDocument());
    fireEvent.click(utils.getByText('Add'));
    fireEvent.change(utils.getByPlaceholderText('Task title...'), { target: { value: 'Test Task' } });
    fireEvent.change(utils.getByLabelText('Category'), { target: { value: 'daily' } });
    fireEvent.click(utils.getByText('Add Task'));
    expect(utils.getByText('Test Task')).toBeInTheDocument();
  });
});
