// tests/WidgetGrid.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import WidgetGrid from "../components/widget-grid/WidgetGrid";
import { supabase } from "../auth/supabaseClient";

// Mock Supabase and preferences
vi.mock("../auth/supabaseClient", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } }))
    }
  }
}));

vi.mock("../api/preferences", () => ({
  getUserPreferences: vi.fn(() => Promise.resolve(null)),
  saveUserPreferences: vi.fn(() => Promise.resolve())
}));

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();

  // ResizeObserver mock - SET THIS UP FIRST
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // matchMedia mock for parallax effect
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

// Utility to mock getBoundingClientRect
const mockRect = (el, rect = {}) => {
  const base = {
    x: 0, y: 0, top: 0, left: 0,
    bottom: 200, right: 300,
    width: 300, height: 200,
    toJSON: () => ({})
  };
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ ...base, ...rect });
};

describe("<WidgetGrid>", () => {
  it("renders grid container with settings button", () => {
    render(<WidgetGrid cols={5} rows={4} cellW={50} rowH={60} gap={10} />);

    const container = document.querySelector(".ios-widget-grid-container");
    expect(container).toBeInTheDocument();

    const settingsBtn = screen.getByLabelText(/open settings/i);
    expect(settingsBtn).toBeInTheDocument();
  });

  it("renders grid with correct CSS variables", () => {
    const { container } = render(
      <WidgetGrid cols={5} rows={4} cellW={50} rowH={60} gap={10} showGrid>
        <div data-testid="child">Child Widget</div>
      </WidgetGrid>
    );

    const grid = container.querySelector(".ios-widget-grid");
    expect(grid).toBeInTheDocument();
    
    // Check CSS variables are set
    const style = grid.getAttribute("style") || "";
    expect(style).toContain("--cell-width:");
    expect(style).toContain("--cell-height:");
    expect(style).toContain("--grid-gap:");

    // Child renders
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows and hides grid lines with showGrid prop", () => {
    const { container, rerender } = render(<WidgetGrid showGrid={true} />);
    
    let grid = container.querySelector(".ios-widget-grid");
    expect(grid.classList.contains("show-grid")).toBe(true);

    rerender(<WidgetGrid showGrid={false} />);
    grid = container.querySelector(".ios-widget-grid");
    expect(grid.classList.contains("show-grid")).toBe(false);
  });

  it("toggles settings panel", async () => {
    render(<WidgetGrid />);

    // Initially hidden
    expect(screen.queryByText(/customize widgets/i)).not.toBeInTheDocument();

    // Open settings
    const settingsBtn = screen.getByLabelText(/open settings/i);
    fireEvent.click(settingsBtn);
    
    expect(screen.getByText(/customize widgets/i)).toBeInTheDocument();

    // Close settings
    const closeBtn = screen.getByText(/close/i);
    fireEvent.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByText(/customize widgets/i)).not.toBeInTheDocument();
    });
  });

  it("updates widget color in settings", async () => {
    render(<WidgetGrid />);

    fireEvent.click(screen.getByLabelText(/open settings/i));
    await screen.findByText(/customize widgets/i);

    const colorInput = screen.getByLabelText(/widget color/i);
    expect(colorInput).toHaveAttribute("type", "color");

    fireEvent.change(colorInput, { target: { value: "#ff0000" } });
    expect(colorInput.value).toBe("#ff0000");

    // Color preview shows the value
    const preview = screen.getByText(/#ff0000/i);
    expect(preview).toBeInTheDocument();
  });

  it("handles wallpaper upload", async () => {
    render(<WidgetGrid />);

    fireEvent.click(screen.getByLabelText(/open settings/i));
    await screen.findByText(/customize widgets/i);

    // Mock FileReader
    const mockReadAsDataURL = vi.fn(function () {
      const self = this;
      setTimeout(() => {
        if (typeof self.onload === "function") {
          self.onload({ target: { result: "data:image/png;base64,FAKE" } });
        }
      }, 0);
    });

    const OriginalFileReader = global.FileReader;
    function MockFileReader() {
      this.onload = null;
      this.readAsDataURL = mockReadAsDataURL;
    }
    vi.stubGlobal("FileReader", MockFileReader);

    const fileInput = screen.getByLabelText(/wallpaper/i);
    const file = new File(["fake"], "wall.png", { type: "image/png" });
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });
    
    fireEvent.change(fileInput);

    // Wait for wallpaper to be applied
    await waitFor(() => {
      const wallEl = document.querySelector(".ios-wallpaper");
      const styleStr = (wallEl?.getAttribute("style") || "").toLowerCase();
      expect(styleStr).toMatch(/background-image:\s*url\(/);
    });

    if (OriginalFileReader) vi.stubGlobal("FileReader", OriginalFileReader);
  });

  it("applies parallax effect on wallpaper pointer move", async () => {
    render(<WidgetGrid />);

    // Set up wallpaper first
    fireEvent.click(screen.getByLabelText(/open settings/i));
    await screen.findByText(/customize widgets/i);

    const mockReadAsDataURL = vi.fn(function () {
      const self = this;
      setTimeout(() => {
        if (typeof self.onload === "function") {
          self.onload({ target: { result: "data:image/png;base64,FAKE" } });
        }
      }, 0);
    });

    function MockFileReader() {
      this.onload = null;
      this.readAsDataURL = mockReadAsDataURL;
    }
    vi.stubGlobal("FileReader", MockFileReader);

    const fileInput = screen.getByLabelText(/wallpaper/i);
    const file = new File(["fake"], "wall.png", { type: "image/png" });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const wallEl = document.querySelector(".ios-wallpaper");
      expect(wallEl?.style.backgroundImage).toContain("url");
    });

    const wallEl = document.querySelector(".ios-wallpaper");
    mockRect(wallEl, { width: 300, height: 200, left: 0, top: 0 });

    // Simulate pointer move
    fireEvent.pointerMove(wallEl, { clientX: 250, clientY: 150 });
    expect(wallEl.style.transform).toMatch(/translate3d\(/);

    // Pointer leave resets transform
    fireEvent.pointerLeave(wallEl);
    expect(wallEl.style.transform).toBe("translate3d(0, 0, 0)");
  });

  it("calls onResetLayout when reset button clicked with confirmation", () => {
    const onResetLayout = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<WidgetGrid onResetLayout={onResetLayout} />);

    fireEvent.click(screen.getByLabelText(/open settings/i));
    
    const resetBtn = screen.getByText(/reset layout/i);
    fireEvent.click(resetBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onResetLayout).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("does not reset layout if confirmation is cancelled", () => {
    const onResetLayout = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<WidgetGrid onResetLayout={onResetLayout} />);

    fireEvent.click(screen.getByLabelText(/open settings/i));
    
    const resetBtn = screen.getByText(/reset layout/i);
    fireEvent.click(resetBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onResetLayout).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("renders children widgets", () => {
    render(
      <WidgetGrid>
        <div data-testid="widget-1">Widget 1</div>
        <div data-testid="widget-2">Widget 2</div>
      </WidgetGrid>
    );

    expect(screen.getByTestId("widget-1")).toBeInTheDocument();
    expect(screen.getByTestId("widget-2")).toBeInTheDocument();
  });

  it("applies custom className to grid", () => {
    const { container } = render(<WidgetGrid className="custom-class" />);
    const grid = container.querySelector(".ios-widget-grid");
    expect(grid.classList.contains("custom-class")).toBe(true);
  });

  it("applies custom styles to grid", () => {
    const customStyle = { background: "red", padding: "20px" };
    const { container } = render(<WidgetGrid style={customStyle} />);
    const grid = container.querySelector(".ios-widget-grid");
    expect(grid.style.background).toBe("red");
    expect(grid.style.padding).toBe("20px");
  });

  it("respects reduced motion preference for parallax", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<WidgetGrid />);
    
    const wallEl = document.querySelector(".ios-wallpaper");
    mockRect(wallEl, { width: 300, height: 200, left: 0, top: 0 });

    // With reduced motion, parallax shouldn't apply
    fireEvent.pointerMove(wallEl, { clientX: 250, clientY: 150 });
    // Transform should not change or remain at initial state
    expect(wallEl.style.transform).not.toMatch(/translate3d\([^0]/);
  });

  it("handles resize events to recalculate cell sizes", () => {
    const { container } = render(<WidgetGrid cols={10} rows={8} />);
    
    const grid = container.querySelector(".ios-widget-grid");
    expect(grid).toBeInTheDocument();

    // Trigger resize
    window.dispatchEvent(new Event('resize'));
    
    // Grid should still be present and functional
    expect(grid).toBeInTheDocument();
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<WidgetGrid />);
    
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    unmount();
    
    // Should clean up resize listeners
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    removeEventListenerSpy.mockRestore();
  });
});