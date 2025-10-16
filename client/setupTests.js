import "@testing-library/jest-dom";

import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => cleanup());

beforeAll(() => {
    // expose Vite-style envs for tests
    (import.meta).env = {
        ...(import.meta?.env ?? {}),
        VITE_SUPABASE_URL: "https://example-project.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test_anon_key",
    };

    // Mock ResizeObserver for tests
    global.ResizeObserver = class ResizeObserver {
        constructor(callback) {
            this.callback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

// default mock for react-router navigate (overridable per test)
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});
