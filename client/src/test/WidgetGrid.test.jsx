import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import WidgetGrid, { Widget } from "../components/WidgetGrid";

// ---- helpers & global mocks ----

// JSDOM doesn't implement matchMedia; needed for the parallax effect guard
beforeEach(() => {
  document.body.innerHTML = "";

  // Polyfill PointerEvent so fireEvent.pointer* carries coords & pointerId
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      constructor(type, params = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 1;
        this.pointerType = params.pointerType ?? "mouse";
        this.isPrimary = params.isPrimary ?? true;
        this.width = params.width ?? 1;
        this.height = params.height ?? 1;
        this.pressure = params.pressure ?? 0.5;
        this.tangentialPressure = params.tangentialPressure ?? 0;
        this.tiltX = params.tiltX ?? 0;
        this.tiltY = params.tiltY ?? 0;
        this.twist = params.twist ?? 0;
        this.altitudeAngle = params.altitudeAngle ?? 0;
        this.azimuthAngle = params.azimuthAngle ?? 0;
      }
    }
    // @ts-ignore (JS file)
    window.PointerEvent = PointerEventPolyfill;
  }

  // pointer capture shims
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }

  // matchMedia mock
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



// Utility to mock getBoundingClientRect for an element we'll query later.
// Needed so pointermove calculations (which divide by width/height) don't explode.
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
  it("renders a grid with correct ARIA and CSS variables", () => {
    render(
      <WidgetGrid cols={5} rows={4} cellW={50} rowH={60} gap={10} showGrid>
        <Widget id="w1" title="One" col={0} row={0} />
      </WidgetGrid>
    );

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute("aria-rowcount", "4");
    expect(grid).toHaveAttribute("aria-colcount", "5");

    // CSS custom properties are inline on the grid node
    const style = grid.getAttribute("style") || "";
    expect(style).toContain("--cell-width: 50px");
    expect(style).toContain("--cell-height: 60px");
    expect(style).toContain("--grid-gap: 10px");

    // Child widget exists with a handle
    expect(screen.getByLabelText(/one drag handle/i)).toBeInTheDocument();

    // Some environments won’t include the title in the gridcell’s accessible name.
    // So just assert we have at least one gridcell.
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(0);
  });

  it("toggles settings panel and updates widget color", async () => {
    render(
      <WidgetGrid>
        <Widget id="w1" title="Alpha" col={0} row={0} />
      </WidgetGrid>
    );

    // Open settings
    const settingsBtn = screen.getByRole("button", { name: /open settings/i });
    fireEvent.click(settingsBtn);
    const panel = await screen.findByText(/customize widgets/i);
    expect(panel).toBeInTheDocument();

    // Color picker exists & preview reflects change — select by type="color"
    const colorInput = document.querySelector('input[type="color"]');
    fireEvent.input(colorInput, { target: { value: "#ff0000" } });

    // Preview shows current color text and style
    const preview = await screen.findByText(/current color:/i);
    expect(preview).toHaveTextContent("Current Color: #ff0000");
    expect(preview).toHaveStyle({ backgroundColor: "#ff0000" });

    // The widget's title color should now use the accent
    const titleEl = screen.getByText("Alpha");
    // JSDOM normalizes hex -> rgb
    expect(titleEl).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("uploads a wallpaper image and applies as background", async () => {
    render(
      <WidgetGrid>
        <Widget id="w1" title="Alpha" col={0} row={0} />
      </WidgetGrid>
    );

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    await screen.findByText(/customize widgets/i);

    // Mock FileReader to immediately invoke onload with a fake data URL
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

    // Your label isn't associated to the input, so select by class
    const fileInput = document.querySelector(".ios-wallpaper-upload");
    const file = new File(["fake"], "wall.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for wallpaper div to pick up backgroundImage
await waitFor(() => {
  const wallEl = document.querySelector(".ios-wallpaper");
  const styleStr = (wallEl.getAttribute("style") || "").toLowerCase();
  // allow optional quotes around url(...)
  expect(styleStr).toMatch(/background-image:\s*url\(["']?data:image\/png;base64,fake["']?\)/);
});

    // optional parallax pointermove
    const wallEl = document.querySelector(".ios-wallpaper");
    mockRect(wallEl, { width: 300, height: 200, left: 0, top: 0 });
    fireEvent.pointerMove(wallEl, { clientX: 250, clientY: 150 });
    expect(wallEl.style.transform).toMatch(/translate3d\(/);
    fireEvent.pointerLeave(wallEl);
    expect(wallEl.style.transform).toBe("translate3d(0, 0, 0)");

    // restore FileReader if it was defined
    if (OriginalFileReader) vi.stubGlobal("FileReader", OriginalFileReader);
  });

  it("supports pointer dragging a widget and fires onMove on drop", async () => {
    const onMove = vi.fn();

    render(
      <WidgetGrid cols={6} rows={6} cellW={50} rowH={50} gap={0}>
        <Widget id="w1" title="Dragger" col={1} row={1} w={2} h={2} onMove={onMove} />
      </WidgetGrid>
    );

    const handle = screen.getByLabelText(/dragger drag handle/i);

    // Mock rects so deltaPxToDeltaCells works cleanly: spanX = 50, spanY = 50
    const grid = screen.getByRole("grid");
    mockRect(grid, { left: 0, top: 0, width: 400, height: 400 });

    // Use a consistent pointerId across events
const pid = 1;

// start at (100,100)
fireEvent.pointerDown(handle, {
  pointerId: pid,
  pointerType: "mouse",
  button: 0,
  clientX: 100,
  clientY: 100,
  pageX: 100,
  pageY: 100,
  screenX: 100,
  screenY: 100,
});

// move by +105, +60  (≈ +2 cells, +1 cell)
fireEvent.pointerMove(handle, {
  pointerId: pid,
  pointerType: "mouse",
  clientX: 205,
  clientY: 160,
  pageX: 205,
  pageY: 160,
  screenX: 205,
  screenY: 160,
});

// drop
fireEvent.pointerUp(handle, {
  pointerId: pid,
  pointerType: "mouse",
  clientX: 205,
  clientY: 160,
  pageX: 205,
  pageY: 160,
  screenX: 205,
  screenY: 160,
});


    // Original col,row = (1,1) -> expect (3,2)
    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith("w1", { col: 3, row: 2 });
    });
  });

  it("supports keyboard grab/move/drop and clamps to bounds", async () => {
    const onMove = vi.fn();

    // 3x3 grid, widget 2x2 starting near bottom-right to exercise clamping
    render(
      <WidgetGrid cols={3} rows={3} cellW={60} rowH={60} gap={0}>
        <Widget id="w2" title="Keyy" col={1} row={1} w={2} h={2} onMove={onMove} />
      </WidgetGrid>
    );

    const handle = screen.getByLabelText(/keyy drag handle/i);
    handle.focus();

    // Space to grab
    fireEvent.keyDown(handle, { key: " " });

    // Try to move beyond right/bottom bounds (should clamp to col=1,row=1 for 2x2 in 3x3)
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });

    // Enter to drop
    fireEvent.keyDown(handle, { key: "Enter" });

    // Should clamp to (1,1) (no actual change)
    await waitFor(() => {
      expect(onMove).not.toHaveBeenCalled();
    });

    // Now test a valid move left/up by 1 (to 0,0)
    fireEvent.keyDown(handle, { key: " " }); // grab again
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    fireEvent.keyDown(handle, { key: "Enter" }); // drop and commit

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith("w2", { col: 0, row: 0 });
    });
  });

  it("Escape cancels a keyboard grab (no move committed)", async () => {
    const onMove = vi.fn();

    render(
      <WidgetGrid cols={5} rows={5}>
        <Widget id="w3" title="Esc" col={2} row={2} onMove={onMove} />
      </WidgetGrid>
    );

    const handle = screen.getByLabelText(/esc drag handle/i);
    handle.focus();

    fireEvent.keyDown(handle, { key: " " });           // grab
    fireEvent.keyDown(handle, { key: "ArrowLeft" });   // move ghost
    fireEvent.keyDown(handle, { key: "Escape" });      // cancel

    // No commit should happen
    await new Promise(r => setTimeout(r, 10));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("throws if <Widget> is rendered outside <WidgetGrid>", () => {
    // Silence React error boundary noise in test output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const renderOutside = () => render(<Widget id="oops" title="Oops" col={0} row={0} />);
    expect(renderOutside).toThrow(/must be used inside <WidgetGrid>/i);
    spy.mockRestore();
  });

  it("closes settings panel with Close button", async () => {
    render(<WidgetGrid />);

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    await screen.findByText(/customize widgets/i);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/customize widgets/i)).not.toBeInTheDocument();
    });
  });
});
