import React, { useEffect, useState, useRef } from "react";

function CanvasWidget() {
  // For hold-to-complete
  const [holdId, setHoldId] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimeout = useRef();
  const holdInterval = useRef();
  const [fadingIds, setFadingIds] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseFilter, setCourseFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  // Assign a color to each course
  const courseColors = {
    "SOFTENG 310": "#f59e42",
    "SOFTENG 306": "#60a5fa",
    "SOFTENG 325": "#34d399",
    "COMPSCI 367": "#a78bfa",
    "(Custom)": "#e5e7eb"
  };

  useEffect(() => {
    fetch("/src/mock_canvas_todos.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load todos");
        return res.json();
      })
      .then((data) => {
        setTodos(data.map(t => ({ ...t, done: false, source: "canvas" })));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filtering logic
  let filtered = [...todos];
  if (courseFilter !== "all") {
    filtered = filtered.filter(t => t.course === courseFilter);
  }
  if (timeFilter !== "all") {
    const now = new Date();
    let minDate = null, maxDate = null;
    if (timeFilter === "today") {
      minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (timeFilter === "7days") {
      minDate = now;
      maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "14days") {
      minDate = now;
      maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    if (minDate && maxDate) {
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= minDate && new Date(t.dueDate) < maxDate);
    }
  }
  // Filter by completion status
  if (!showCompleted) {
    filtered = filtered.filter(t => !t.done);
  } else {
    filtered = filtered.filter(t => t.done);
  }

  // Unique course list for filter dropdown and add modal
  const courseList = ["all", ...Array.from(new Set(todos.map(t => t.course)))];

  const toggleTodo = (id) => {
    // If already fading, ignore
    if (fadingIds.includes(id)) return;
    // If marking as done, fade out first
    const todo = todos.find(t => t.id === id);
    if (todo && !todo.done) {
      setFadingIds(f => [...f, id]);
      setTimeout(() => {
        setTodos((prev) => prev.map(t => t.id === id ? { ...t, done: true } : t));
        setFadingIds(f => f.filter(fid => fid !== id));
      }, 350); // match CSS transition duration
    } else {
      // If unchecking, just update immediately
      setTodos((prev) => prev.map(t => t.id === id ? { ...t, done: false } : t));
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'salmon' }}>Error: {error}</div>;


  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      {/* Responsive controls: Add button on top if not enough space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            style={{
              fontSize: 13,
              minWidth: 110,
              maxWidth: 180,
              padding: '4px 8px',
              borderRadius: 5,
              border: '1.5px solid #e5e7eb',
              appearance: 'auto',
              WebkitAppearance: 'auto',
              MozAppearance: 'auto',
              background: '#f9fafb',
              color: '#22223b',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
            onBlur={e => e.target.style.border = '1.5px solid #cbd5e1'}
          >
            {courseList.map(c => (
              <option key={c} value={c}>{c === "all" ? "All Courses" : c}</option>
            ))}
          </select>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}
            style={{
              fontSize: 13,
              minWidth: 110,
              maxWidth: 180,
              padding: '4px 8px',
              borderRadius: 5,
              border: '1.5px solid #e5e7eb',
              appearance: 'auto',
              WebkitAppearance: 'auto',
              MozAppearance: 'auto',
              background: '#f9fafb',
              color: '#22223b',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
            onBlur={e => e.target.style.border = '1.5px solid #cbd5e1'}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Next 7 Days</option>
            <option value="14days">Next 14 Days</option>
          </select>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 5,
              border: '1.5px solid #e5e7eb',
              background: showCompleted ? '#6366f1' : '#f9fafb',
              color: showCompleted ? '#fff' : '#22223b',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
        </div>
      </div>

      <div style={{
        paddingRight: 8,
        position: 'relative',
      }}>
        {/** list for tasks */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered
            .sort((a, b) => {
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate) - new Date(b.dueDate);
            })
            .map(todo => {
              const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.done;
              return (
                <li
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: 12,
                    background: todo.done ? "#e0f2fe" : courseColors[todo.course] || "#fff",
                    color: todo.done ? "#888" : "#222",
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    border: isOverdue ? "2.5px solid #ef4444" : "none",
                    position: "relative",
                    transition: "background 0.2s, opacity 0.35s, transform 0.35s",
                    opacity: fadingIds.includes(todo.id) ? 0 : 1,
                    transform: fadingIds.includes(todo.id) ? 'translateY(30px)' : 'translateY(0)',
                    pointerEvents: fadingIds.includes(todo.id) ? 'none' : 'auto',
                  }}
                >
                  <button
                    type="button"
                    aria-label={todo.done ? "Completed" : "Mark as done"}
                    onMouseDown={() => {
                      if (todo.done) return;
                      setHoldId(todo.id);
                      setHoldProgress(0);
                      let progress = 0;
                      holdInterval.current = setInterval(() => {
                        progress += 100 / 9; // 1s, 9 steps
                        setHoldProgress(progress);
                      }, 100);
                      holdTimeout.current = setTimeout(() => {
                        clearInterval(holdInterval.current);
                        setHoldProgress(100);
                        toggleTodo(todo.id);
                        setHoldId(null);
                      }, 1000);
                    }}
                    onMouseUp={() => {
                      clearTimeout(holdTimeout.current);
                      clearInterval(holdInterval.current);
                      setHoldProgress(0);
                      setHoldId(null);
                    }}
                    onMouseLeave={() => {
                      clearTimeout(holdTimeout.current);
                      clearInterval(holdInterval.current);
                      setHoldProgress(0);
                      setHoldId(null);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      minHeight: 36,
                      borderRadius: '50%',
                      border: todo.done ? '2.5px solid #22c55e' : '2.5px solid #cbd5e1',
                      background: todo.done ? '#22c55e' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: todo.done ? 'default' : 'pointer',
                      marginTop: 2,
                      marginRight: 12,
                      position: 'relative',
                      outline: 'none',
                      transition: 'background 0.2s, border 0.2s',
                      boxShadow: undefined,
                      padding: 0,
                      overflow: 'visible',
                    }}
                    disabled={todo.done}
                  >
                    {/* Green Tick icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={todo.done ? '#fff' : '#22c55e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: todo.done ? 1 : 0.8, display: 'block' }}>
                      <polyline points="5 11 9 15 15 7" />
                    </svg>
                    {/* Progress ring */}
                    {holdId === todo.id && !todo.done && (
                      <svg width="40" height="40" style={{ position: 'absolute', top: -4, left: -4, pointerEvents: 'none', zIndex: 1 }}>
                        <circle
                          cx="20" cy="20" r="17"
                          stroke="#22c55e"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 17}
                          strokeDashoffset={2 * Math.PI * 17 * (1 - holdProgress / 100)}
                          style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%'
                          }}
                        />
                      </svg>
                    )}
                  </button>
                  <div style={{ marginLeft: 4, flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 16,
                      marginBottom: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textDecoration: todo.done ? "line-through" : "none",
                      transition: 'text-decoration 0.2s',
                    }} title={todo.title}>
                      {todo.title}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>{todo.course}</div>
                    {todo.dueDate && (
                      <div style={{
                         fontSize: 12,
                         opacity: isOverdue ? 1 : 0.7,
                         color: isOverdue ? "#ef4444" : 'inherit',
                         fontWeight: isOverdue ? "bold" : 'normal',
                          }}>
                        Due: {new Date(todo.dueDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

export default CanvasWidget;