import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../App.css"

// CHANGE: Added helper to pretty-print JSON and copy to clipboard
const stringifyPretty = (obj) => {
  if (obj == null) return '';
  if (typeof obj === 'string') {
    // If backend returned a JSON-encoded string, try to parse once
    try {
      const parsed = JSON.parse(obj);
      if (typeof parsed === 'string') return parsed;
    } catch {
      // not JSON-encoded; fall through
    }
    // Reveal common escape sequences so \\n renders as a real newline in <pre>
    return obj
      .replaceAll('\\r\\n', '\n')
      .replaceAll('\\n', '\n')
      .replaceAll('\\t', '\t');
  }
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

export function Form() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false); // CHANGE: copy feedback state

  // Session memory (current page session persisted in localStorage)
  const [history, setHistory] = useState([]); // [{ role: 'user'|'assistant', content: string }]

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gpt_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gpt_history', JSON.stringify(history));
    } catch { }
  }, [history]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stringifyPretty(responseData));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setResponseData(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResponseData(null);

    // Append the user turn to a working copy of history (limit to last 8 turns to keep payload small)
    const nextHistoryUser = [...history, { role: 'user', content: input }];
    const recentHistory = nextHistoryUser.slice(-8);

    try {
      const response = await axios.post(
        'http://localhost:8080/api/ai/complete',
        { question: input, history: recentHistory },
        {
          headers: {
            'Content-Type': 'text/plain', // preserve existing contract
          },
        }
      );

      setResponseData(response.data);

      // Stringify into readable text for transcript storage
      const assistantText = stringifyPretty(response.data);
      setHistory([...nextHistoryUser, { role: 'assistant', content: assistantText }]);
      setInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      // Still commit the user message so transcript reflects the attempt
      setHistory(nextHistoryUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CHANGE: modern container and card styling with subtle glass effect
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-xl text-left">
          {/* Header */}
          {/* CHANGE: cleaner header with icon and helper text */}
          <div className="p-5 sm:p-6 text-left">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Ask Chat…</h3>
                <p className="text-sm text-slate-600">What's on your mind today? Talk to the almighty GPT wrapper.</p>
              </div>
            </div>
          </div>

          {/* Transcript (session memory) */}
          {history.length > 0 && (
            <div className="px-5 sm:px-6 pb-3">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700">Current session</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="ml-auto inline-flex items-center rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/50"
                >
                  Reset chat
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 shadow-inner max-h-56 overflow-auto p-3 space-y-2">
                {history.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'text-slate-900' : 'text-slate-800'}>
                    <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className={m.role === 'user' ? 'text-indigo-700' : 'text-emerald-700'}>
                        {m.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Turn {idx + 1}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', margin: 0 }}>
                      {m.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          {/* CHANGE: one-column layout, large target textarea, clear focus/hover/disabled states */}
          <form onSubmit={handleSubmit} className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 text-left" aria-describedby="helper-text">
            <label htmlFor="gpt-input" className="sr-only">Your question</label>
            <br></br>
            <textarea
              id="gpt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              rows={4}
              className="w-full max-w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-60"
              disabled={loading}
            />
            <div id="helper-text" className="text-xs text-slate-500">Press submit or keep typing to refine your prompt.</div>

            <div className="flex items-center gap-3">
              {/* CHANGE: modern primary button with loading spinner */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {loading ? 'Submitting…' : 'Submit'}
              </button>

              {/* CHANGE: subtle character count */}
              <span className="ml-auto text-xs text-slate-500" style={{ paddingLeft: 10 }}>{input.length} chars</span>
            </div>
          </form>

          {/* Feedback Area */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
            {/* CHANGE: styled success panel for response */}
            {responseData && (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">AI Response</p>
                  <div className="flex items-center gap-2">
                  </div>
                </div>
                <pre
                  className="w-full max-h-72 overflow-auto rounded-xl bg-white/90 p-3 text-sm leading-relaxed shadow-inner whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                >
                  {stringifyPretty(responseData)}
                </pre>
                {/* CHANGE: polite live region for screen readers */}
                <div className="sr-only" role="status" aria-live="polite">Response loaded</div>
              </div>
            )}

            {/* CHANGE: styled error panel */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
                <p className="font-semibold">Request failed</p>
                <p className="mt-1 text-sm">{error}</p>
                <div className="sr-only" role="status" aria-live="assertive">An error occurred</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Form;