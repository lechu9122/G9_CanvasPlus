import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import Form from "../components/GptWrapper.jsx"; // adjust path if needed

vi.mock("axios", () => ({ default: { post: vi.fn() } }));

// Helpers for localStorage
const seedHistory = (entries) =>
  localStorage.setItem("gpt_history", JSON.stringify(entries));
const getHistory = () => JSON.parse(localStorage.getItem("gpt_history") || "[]");

describe("Form component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("loads session history from localStorage", () => {
    seedHistory([{ role: "user", content: "hi" }, { role: "assistant", content: "yo" }]);
    render(<Form />);
    expect(screen.getByText(/Current session/i)).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText(/hi/)).toBeInTheDocument();
    const header = screen.getByText(/Current session/i);
    const panel = header.parentElement?.nextElementSibling; // the scrolling transcript panel
    expect(panel).toBeTruthy();
    expect(within(panel).getByText('yo')).toBeInTheDocument();
  });

  it("disables submit when input empty, updates char count", async () => {
    render(<Form />);
    const btn = screen.getByRole("button", { name: /submit/i });
    expect(btn).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(screen.getByText(/3 chars/i)).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it("submits, posts with history (truncated to 8), shows response", async () => {
    // history longer than 8
    seedHistory(Array.from({ length: 10 }, (_, i) => ({ role: "user", content: "x" + i })));
    let resolvePost;
    const postPromise = new Promise((res) => (resolvePost = res));
    axios.post.mockReturnValueOnce(postPromise);

    render(<Form />);
    await userEvent.type(screen.getByRole("textbox"), "hello");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    const submittingBtn = await screen.findByRole('button', { name: /submitting/i });
    expect(submittingBtn).toBeDisabled();

    // finish the request now
    resolvePost({ data: { answer: 'ok' } });
    await waitFor(() => expect(screen.getByText(/AI Response/i)).toBeInTheDocument());

    const [url, payload] = axios.post.mock.calls[0];
    expect(url).toContain("/api/ai/complete");
    expect(payload.question).toBe("hello");
    expect(payload.history.length).toBe(8);

    // persisted
    const lastTwo = getHistory().slice(-2);
    expect(lastTwo[0].role).toBe("user");
    expect(lastTwo[1].role).toBe("assistant");
  });

  it("handles backend error and keeps user message", async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: "Nope" } } });
    render(<Form />);
    await userEvent.type(screen.getByRole("textbox"), "bad");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(screen.getByText(/Request failed/i)).toBeInTheDocument());
    expect(screen.getByText(/Nope/)).toBeInTheDocument();

    const last = getHistory().at(-1);
    expect(last).toEqual({ role: "user", content: "bad" });
  });

  it("resets history when Reset chat clicked", async () => {
    seedHistory([{ role: "user", content: "abc" }]);
    render(<Form />);
    await userEvent.click(screen.getByRole("button", { name: /Reset chat/i }));
    expect(screen.queryByText(/Current session/i)).not.toBeInTheDocument();
    expect(getHistory()).toEqual([]);
  });
});