import React, { useState, useEffect, useRef } from 'react';
import ModalPortal from '../ui/ModalPortal';
import useFocusTrap from '../../hooks/useFocusTrap';
import useScrollLock from '../../hooks/useScrollLock';
import '../../css/modal.css';

/**
 * AddTaskModal component for adding new daily schedule tasks.
 * Renders as a modal overlay with focus trap, scroll lock, and full accessibility.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Function} props.onSubmit - Callback with task data { title, start (minutes), end (minutes) }
 * @param {React.RefObject} props.triggerRef - Ref to the trigger button to restore focus
 */
function AddTaskModal({ isOpen, onClose, onSubmit, triggerRef }) {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    duration: 30
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialFormData = useRef({ title: '', startTime: '', duration: 30 });

  // Focus trap and scroll lock
  const modalRef = useFocusTrap(isOpen);
  useScrollLock(isOpen);

  // Set aria-hidden on app root when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const appRoot = document.getElementById('root');
    if (appRoot) {
      appRoot.setAttribute('aria-hidden', 'true');
    }

    return () => {
      if (appRoot) {
        appRoot.removeAttribute('aria-hidden');
      }
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDirty]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', startTime: '', duration: 30 });
      setErrors({});
      setIsDirty(false);
      initialFormData.current = { title: '', startTime: '', duration: 30 };
    }
  }, [isOpen]);

  // Check if form is dirty
  const checkDirty = (data) => {
    return (
      data.title !== initialFormData.current.title ||
      data.startTime !== initialFormData.current.startTime ||
      data.duration !== initialFormData.current.duration
    );
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsDirty(checkDirty(newData));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Task title must be at least 2 characters';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.duration || formData.duration < 5) {
      newErrors.duration = 'Duration must be at least 5 minutes';
    } else if (formData.duration > 480) {
      newErrors.duration = 'Duration cannot exceed 8 hours (480 minutes)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Announce errors to screen readers
      const errorSummary = document.getElementById('modal-error-summary');
      if (errorSummary) {
        errorSummary.focus();
      }
      return;
    }

    // Convert time to minutes
    const [hours, minutes] = formData.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + parseInt(formData.duration, 10);

    onSubmit({
      title: formData.title.trim(),
      start: startMinutes,
      end: endMinutes,
      done: false
    });

    // Close modal
    onClose();

    // Restore focus to trigger
    if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }

    onClose();

    // Restore focus to trigger
    if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <ModalPortal>
      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          ref={modalRef}
          className="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Header */}
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">
              Add New Task
            </h2>
            <button
              type="button"
              className="modal-close-button"
              onClick={handleClose}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <p id="modal-description" className="sr-only">
              Form to add a new daily schedule task with title, start time, and duration
            </p>

            {/* Error Summary */}
            {hasErrors && (
              <div
                id="modal-error-summary"
                className="modal-error-summary"
                role="alert"
                aria-live="polite"
                tabIndex={-1}
              >
                <h3 className="modal-error-summary-title">
                  Please fix the following errors:
                </h3>
                <ul>
                  {Object.entries(errors).map(([field, error]) => (
                    error && <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <form id="add-task-form" onSubmit={handleSubmit} noValidate>
              {/* Title */}
              <div className="modal-form-group">
                <label htmlFor="task-title" className="modal-form-label">
                  Task Title<span className="required">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  className={`modal-form-input ${errors.title ? 'error' : ''}`}
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Team Meeting"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  maxLength={100}
                />
                {errors.title && (
                  <span id="title-error" className="modal-form-error" role="alert">
                    {errors.title}
                  </span>
                )}
              </div>

              {/* Start Time */}
              <div className="modal-form-group">
                <label htmlFor="start-time" className="modal-form-label">
                  Start Time<span className="required">*</span>
                </label>
                <input
                  id="start-time"
                  type="time"
                  className={`modal-form-input ${errors.startTime ? 'error' : ''}`}
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.startTime}
                  aria-describedby={errors.startTime ? 'start-time-error' : 'start-time-hint'}
                />
                {errors.startTime ? (
                  <span id="start-time-error" className="modal-form-error" role="alert">
                    {errors.startTime}
                  </span>
                ) : (
                  <span id="start-time-hint" className="modal-form-hint">
                    Select the time when this task should start
                  </span>
                )}
              </div>

              {/* Duration */}
              <div className="modal-form-group">
                <label htmlFor="duration" className="modal-form-label">
                  Duration (minutes)<span className="required">*</span>
                </label>
                <input
                  id="duration"
                  type="number"
                  className={`modal-form-input ${errors.duration ? 'error' : ''}`}
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  min="5"
                  max="480"
                  step="5"
                  aria-required="true"
                  aria-invalid={!!errors.duration}
                  aria-describedby={errors.duration ? 'duration-error' : 'duration-hint'}
                />
                {errors.duration ? (
                  <span id="duration-error" className="modal-form-error" role="alert">
                    {errors.duration}
                  </span>
                ) : (
                  <span id="duration-hint" className="modal-form-hint">
                    Between 5 and 480 minutes (8 hours)
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-task-form"
              className="modal-button modal-button-primary"
              disabled={!formData.title.trim() || !formData.startTime}
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default AddTaskModal;
