import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TodoWidget from '../components/TodoWidget';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import "@testing-library/jest-dom/vitest";

describe('TodoWidget', () => {
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

  it('can add a new todo with description and class', async () => {
    render(<TodoWidget />);
    fireEvent.click(screen.getByText('Add'));
    fireEvent.change(screen.getByPlaceholderText('Task title...'), { target: { value: 'Test Task' } });
    fireEvent.change(screen.getByPlaceholderText('Optional details...'), { target: { value: 'Some details' } });
    fireEvent.change(screen.getByPlaceholderText('Class (optional)...'), { target: { value: 'SOFTENG 310' } });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => expect(screen.getByText('Test Task')).toBeInTheDocument());
    expect(screen.getByText('SOFTENG 310')).toBeInTheDocument();
    expect(screen.getByText('Some details')).toBeInTheDocument();
  });

  it('clicking the check toggles done/undone and delete works', async () => {
    render(<TodoWidget />);
    // add a task
    fireEvent.click(screen.getByText('Add'));
    fireEvent.change(screen.getByPlaceholderText('Task title...'), { target: { value: 'Complete Me' } });
    fireEvent.click(screen.getByText('Add Task'));
    await waitFor(() => expect(screen.getByText('Complete Me')).toBeInTheDocument());

    // toggle done (single click now)
    fireEvent.click(screen.getByLabelText('Mark as done'));
    expect(screen.getByText('Complete Me')).toHaveStyle({ textDecoration: 'line-through' });

    // toggle back
    fireEvent.click(screen.getByLabelText('Mark as undone'));
    expect(screen.getByText('Complete Me')).not.toHaveStyle({ textDecoration: 'line-through' });

    // delete
    fireEvent.click(screen.getByTitle('Delete task'));
    await waitFor(() => expect(screen.queryByText('Complete Me')).not.toBeInTheDocument());
  });
});
