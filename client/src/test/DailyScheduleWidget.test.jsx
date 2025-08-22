import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import DailyScheduleWidget from '../components/DailyScheduleWidget';
import { describe, it, expect, test } from 'vitest';
import "@testing-library/jest-dom/vitest";

describe('DailyScheduleWidget', () => {
  it('renders Add Activity button', () => {
    const { container } = render(<DailyScheduleWidget />);
    const utils = within(container);
    expect(utils.getByText('Add Activity')).toBeInTheDocument();
  });

  it('can open and close the add activity modal', () => {
    const { container } = render(<DailyScheduleWidget />);
    const utils = within(container);
    fireEvent.click(utils.getByText('Add Activity'));
    // Modal should open
    expect(utils.getAllByText('Add Activity').length).toBeGreaterThan(1);
    fireEvent.click(utils.getByTitle('Close'));
    // Modal should close (only one Add Activity button remains)
    expect(utils.getAllByText('Add Activity').length).toBe(1);
  });

  it('can add a new activity', () => {
    const { container } = render(<DailyScheduleWidget />);
    const utils = within(container);
    fireEvent.click(utils.getByText('Add Activity'));
    fireEvent.change(utils.getByPlaceholderText('Activity title...'), { target: { value: 'Test Activity' } });
    fireEvent.change(utils.getByLabelText('Start Time'), { target: { value: '12:00' } });
    fireEvent.change(utils.getByLabelText('Duration (minutes)'), { target: { value: 30 } });
    // Click the last 'Add' button (the modal's submit)
    const addButtons = utils.getAllByText('Add');
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(utils.getByText('Test Activity')).toBeInTheDocument();
  });
});
