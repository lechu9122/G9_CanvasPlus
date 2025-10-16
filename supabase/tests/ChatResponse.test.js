import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleRequest } from "../functions/chat-response/index.js";

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn(); // reset fetch before each test
});

// helper to create Request objects
function makeRequest(body, token) {
  return new Request(
    "https://ljygydqwyhlsxhwtnuiz.supabase.co/functions/v1/chat-response",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }
  );
}

describe("ChatResponse handler", () => {
  it("rejects requests with no auth token", async () => {
    const req = makeRequest({ prompt: "Hello" });

    const res = await handleRequest(req, { OPENAI_API_KEY: "dummy_key", TEST_MODE: true });
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe("Unauthorized");
  });

  it("rejects empty prompt", async () => {
    const req = makeRequest({ prompt: "   ", history: [] }, "valid_token");

    // No need to mock fetch for Supabase since TEST_MODE skips JWT check

    const res = await handleRequest(req, { OPENAI_API_KEY: "dummy_key", TEST_MODE: true });
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Missing prompt");
  });

  it("returns assistant response from OpenAI", async () => {
    const req = makeRequest({ prompt: "Hello", history: [] }, "valid_token");

    // Mock OpenAI fetch call
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hi there!" } }],
      }),
    });

    const res = await handleRequest(req, { OPENAI_API_KEY: "dummy_key", TEST_MODE: true });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result).toBe("Hi there!");
  });
});
