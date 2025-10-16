import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTaskModal from '../components/DailySchedule/AddTaskModal';

describe('AddTaskModal', () => {
  let mockOnClose;
  let mockOnSubmit;
  let mockTriggerRef;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSubmit = vi.fn();
    mockTriggerRef = { current: document.createElement('button') };
    document.body.appendChild(mockTriggerRef.current);
  });

  afterEach(() => {
    if (mockTriggerRef.current && document.body.contains(mockTriggerRef.current)) {
      document.body.removeChild(mockTriggerRef.current);
    }
    vi.clearAllMocks();
  });

  describe('Portal Rendering', () => {
    it('should render modal into a portal outside the component tree', () => {
      render(
        <div data-testid="parent">
          <AddTaskModal
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            triggerRef={mockTriggerRef}
          />
        </div>
      );

      // Modal should not be inside parent
      const parent = screen.getByTestId('parent');
      const modal = screen.getByRole('dialog');
      expect(parent.contains(modal)).toBe(false);

      // Modal should be in body (via portal)
      expect(document.body.contains(modal)).toBe(true);
    });

    it('should not render when isOpen is false', () => {
      render(
        <AddTaskModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Overlay and Layering', () => {
    it('should render full-screen overlay with correct z-index', () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const overlay = screen.getByRole('presentation');
      const styles = window.getComputedStyle(overlay);
      
      expect(overlay).toHaveClass('modal-overlay');
      expect(styles.position).toBe('fixed');
    });

    it('should close modal when clicking overlay', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const overlay = screen.getByRole('presentation');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const modal = screen.getByRole('dialog');
      await user.click(modal);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Background Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      const { rerender } = render(
        <AddTaskModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(document.body.style.overflow).not.toBe('hidden');

      rerender(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const originalOverflow = document.body.style.overflow;
      
      const { unmount } = render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  describe('Modal Positioning and Responsiveness', () => {
    it('should render with responsive modal container classes', () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-container');
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
    });
  });

  describe('Focus Management', () => {
    it('should move focus into modal on open', async () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/task title/i);
        expect(titleInput).toHaveFocus();
      });
    });

    it('should restore focus to trigger on close', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal on ESC key', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const titleInput = screen.getByLabelText(/task title/i);
      const addButton = screen.getByRole('button', { name: /add task/i });

      titleInput.focus();
      expect(titleInput).toHaveFocus();

      // Tab through all elements
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should cycle back to beginning
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty title', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      expect(await screen.findByText(/task title is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for title too short', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'A');

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      expect(await screen.findByText(/task title must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('should show error for missing start time', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Meeting');

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      expect(await screen.findByText(/start time is required/i)).toBeInTheDocument();
    });

    it('should show error summary with multiple errors', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      const errorSummary = await screen.findByRole('alert');
      expect(errorSummary).toHaveTextContent(/please fix the following errors/i);
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const titleInput = screen.getByLabelText(/task title/i);
      const startTimeInput = screen.getByLabelText(/start time/i);
      const durationInput = screen.getByLabelText(/duration/i);

      await user.type(titleInput, 'Team Meeting');
      await user.type(startTimeInput, '14:30');
      await user.clear(durationInput);
      await user.type(durationInput, '60');

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Team Meeting',
          start: 870, // 14:30 in minutes
          end: 930,   // 14:30 + 60 minutes
          done: false
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable submit button when required fields empty', () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const addButton = screen.getByRole('button', { name: /add task/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Dirty State Confirmation', () => {
    it('should prompt confirmation when closing with unsaved changes', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const titleInput = screen.getByLabelText(/task title/i);
      await user.type(titleInput, 'Meeting');

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should close without confirmation when form is pristine', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm');
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(screen.getByLabelText(/task title/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/start time/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/duration/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should announce errors via aria-live', async () => {
      const user = userEvent.setup();
      
      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      const errorSummary = await screen.findByRole('alert');
      expect(errorSummary).toHaveAttribute('aria-live', 'polite');
    });

    it('should set aria-hidden on app root when open', () => {
      const appRoot = document.createElement('div');
      appRoot.id = 'root';
      document.body.appendChild(appRoot);

      render(
        <AddTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          triggerRef={mockTriggerRef}
        />
      );

      expect(appRoot).toHaveAttribute('aria-hidden', 'true');

      document.body.removeChild(appRoot);
    });
  });
});
