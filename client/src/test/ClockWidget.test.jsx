/* @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import ClockWidget from "../components/ClockWidget.jsx";
import { act } from "react";


// Make locale/time calculations deterministic in tests
process.env.TZ = "UTC";

describe("ClockWidget", () => {
  beforeEach(() => {
    // Freeze time at Thu, 02 Jan 2025 15:04:05 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-02T15:04:05Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders weekday and date correctly for a fixed time", () => {
    render(<ClockWidget />);
    // Weekday and month/day (en-US)
    expect(screen.getByText("Thursday")).toBeInTheDocument();
    expect(screen.getByText("January")).toBeInTheDocument();
    // Day is numeric, not zero-padded, and appears inside the date box span
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders time parts (hours, minutes, seconds, AM/PM) with proper formatting", () => {
    render(<ClockWidget />);

    // For 15:04:05 UTC with en-US hour12:
    // hour string is "3 PM" -> hoursNums = "3"
    expect(screen.getByText("3")).toBeInTheDocument();

    // minutes/seconds are zero-padded by the component
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();

    // AM/PM suffix
    expect(screen.getByText("PM")).toBeInTheDocument();

  });

  it("ticks every second and updates the seconds display", () => {
    const { container } = render(<ClockWidget />);
    const secondsEl = () => container.querySelector(".time-digits.seconds");

    // starts at :05
    expect(secondsEl().textContent).toBe("05");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(secondsEl().textContent).toBe("06");

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(secondsEl().textContent).toBe("10");
  });

  it("uses tab layout classes when type='tab'", () => {
    const { container } = render(<ClockWidget type="tab" />);

    // Outer container
    const outer = container.querySelector(".tab-card.w-100");
    expect(outer).toBeTruthy();

    // Inner card
    const inner = container.querySelector(".time.tab-container.grid-auto-1ft-row.gap-2");
    expect(inner).toBeTruthy();
  });

  it("uses default layout classes when no type is provided", () => {
    const { container } = render(<ClockWidget />);

    // Outer container
    const outer = container.querySelector(".span-6-center");
    expect(outer).toBeTruthy();

    // Inner card
    const inner = container.querySelector(".time.container.grid-auto-1ft-row.gap-2");
    expect(inner).toBeTruthy();
  });

  it("cleans up its interval on unmount", () => {
    const spy = vi.spyOn(global, "clearInterval");
    const { unmount } = render(<ClockWidget />);
    unmount();

    expect(spy).toHaveBeenCalledTimes(1);
    // Works in both Node (Timer object) and browser (number id)
    expect(spy).toHaveBeenCalledWith(expect.anything());
  });

  it("handles edge-hour formatting (12-hour values) correctly", () => {
    // 12:09:07 AM UTC (edge case: two-digit hour in 12h format)
    vi.setSystemTime(new Date("2025-01-02T00:09:07Z"));
    render(<ClockWidget />);

    // For "12:09:07 AM" -> hoursNums should be "12"
    expect(screen.getByText("12")).toBeInTheDocument();
    // Zero-padded minutes and seconds
    expect(screen.getByText("09")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
    // AM suffix
    expect(screen.getByText("AM")).toBeInTheDocument();
  });
});