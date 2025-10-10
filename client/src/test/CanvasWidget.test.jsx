
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import CanvasWidget from '../components/CanvasWidget';
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

describe('CanvasWidget', () => {
  it('renders dropdowns', async () => {
    const { container } = render(<CanvasWidget />);
    const utils = within(container);
    await waitFor(() => expect(utils.getByText('All Courses')).toBeInTheDocument());
    expect(utils.getByText('All Dates')).toBeInTheDocument();
  });
});

describe('CanvasWidget', () => {
  it('highlights overdue text', async () => {
    const { container } = render(<CanvasWidget />);
    
    await waitFor(() => {
        expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      });

      const overdueTask = screen.getByText('Assignment 1').closest('li');
      const dueDate = overdueTask.querySelector('div[style*="color"]');
      
      expect(dueDate).toHaveStyle({ 
        color: '#ef4444',
        fontWeight: 'bold',
        opacity: '1'
      });
  });
});

describe('CanvasWidget', () => {
  it('highlights overdue border', async () => {
    const { container } = render(<CanvasWidget />);
    
    await waitFor(() => {
        expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      });

      const overdueTask = screen.getByText('Assignment 1').closest('li');
      expect(overdueTask).toHaveStyle({ border: '2.5px solid #ef4444' });
  });
});

describe('CanvasWidget', () => {
  it('completed tasks show when toggled', async () => {
    render(<CanvasWidget />);

    await waitFor(() => {
      expect(screen.getByText('Show Completed')).toBeInTheDocument();
    });

  });
});
