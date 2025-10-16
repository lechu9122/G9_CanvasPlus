import { enableFetchMocks } from "vitest-fetch-mock";

// Enable fetch mocks globally
enableFetchMocks();

// Mock environment variables for tests
import.meta.env = {
  ...(import.meta?.env ?? {}),
  VITE_SUPABASE_URL: "https://example-project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "test_anon_key",
  OPENAI_API_KEY: "test_openai_key",
};

// Optional: log all fetch calls during tests (can be removed later)
beforeEach(() => {
  globalThis.fetchMock?.resetMocks();
});
