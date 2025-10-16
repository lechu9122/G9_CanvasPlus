import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import "../css/GptWrapper.css";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(
  supabaseUrl,      // or REACT_APP_SUPABASE_URL
  supabaseKey       // or REACT_APP_SUPABASE_ANON_KEY
);



// Pretty-print helper (unchanged)
const stringifyPretty = (obj) => {
  if (obj == null) return "";
  if (typeof obj === "string") {
    try {
      const parsed = JSON.parse(obj);
      if (typeof parsed === "string") return parsed;
    } catch {}
    return obj
      .replaceAll("\\r\\n", "\n")
      .replaceAll("\\n", "\n")
      .replaceAll("\\t", "\t");
  }
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

export default function GptWrapper() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null); // kept for compatibility
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); // [{ role: 'user'|'assistant', content: string }]

  // Load saved history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gpt_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {}
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem("gpt_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  const handleReset = () => {
    setHistory([]);
    setResponseData(null);
    setError(null);
    setInput("");
  };

  // Auto-grow textarea
  const taRef = useRef(null);
  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxPx = 8 * 28 + 28; // cap ~8 lines
    el.style.height = Math.min(el.scrollHeight, maxPx) + "px";
  };
  useEffect(autoResize, [input]);

  // Auto-scroll to bottom on new messages
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResponseData(null);

    const nextHistoryUser = [...history, { role: "user", content: input }];
    const recentHistory = nextHistoryUser.slice(-8);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession(); // Supabase v2

      if (sessionError || !session?.access_token) {
        throw new Error("User not authenticated");
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/chat-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: input,
          history: recentHistory,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      const assistantText = stringifyPretty(
        data.result || "No response from model."
      );

      setResponseData(assistantText);
      setHistory([
        ...nextHistoryUser,
        { role: "assistant", content: assistantText },
      ]);
      setInput("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setHistory(nextHistoryUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gptw-card">
      {/* Header: left-focused */}
      <div className="gptw-header">
        <h3>Ask Chat…</h3>
        <p>What's on your mind today? Talk to the almighty GPT wrapper.</p>
      </div>

      {/* Error banner (only if error) */}
      {error && (
        <div className="gptw-error">
          <strong>Request failed:</strong>&nbsp;<span>{error}</span>
        </div>
      )}

      {/* Messages list */}
      <div ref={listRef} className="gptw-list">
        {history.length === 0 && (
          <div className="gptw-empty">Start the conversation below.</div>
        )}

        {history.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`gptw-row ${isUser ? "gptw-right" : "gptw-left"}`}
            >
              {/* USER = right bubble, BOT = plain left text */}
              <div className={`gptw-bubble ${isUser ? "user" : "bot"}`}>
                {m.content}
              </div>

              {/* Tail only for user (right side) */}
              {isUser && <span className="gptw-tail" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Composer sticks to bottom of wrapper */}
      <form onSubmit={handleSubmit} className="gptw-composer">
        <label htmlFor="gpt-input" className="sr-only">
          Your question
        </label>
        <textarea
          id="gpt-input"
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={autoResize}
          placeholder="Ask me anything…"
          rows={5}
          className="gptw-input"
          disabled={loading}
        />

        {/* Reset left, Submit right */}
        <div className="gptw-actions gptw-actions-split">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="gptw-btn secondary"
            aria-label="Reset chat"
          >
            Reset chat
          </button>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="gptw-btn primary"
            aria-label="Submit message"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
