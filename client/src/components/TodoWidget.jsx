import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

function TodoWidget() {
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
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDue, setModalDue] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

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
  // Only show incomplete todos
  filtered = filtered.filter(t => !t.done);

  // Unique course list for filter dropdown and add modal
  const customCategories = ["daily", "reading", "sports"];
  const courseList = ["all", ...Array.from(new Set(todos.map(t => t.course).concat(customCategories)))];
  const addCategoryList = Array.from(new Set(todos.map(t => t.course).concat(customCategories)));

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

  // Only allow deleting custom todos (source !== 'canvas')
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter(t => {
      const todo = prev.find(t2 => t2.id === id);
      return todo && todo.source === "canvas" ? true : t.id !== id;
    }));
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'salmon' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      {/* Responsive controls: Add button on top if not enough space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={() => setShowModal(true)} style={{
            background: '#22223b',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>Add</button>
        </div>
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
        </div>
      </div>

      {/* Modal for adding a new todo (moved to a portal so it is NOT confined by the widget) */}
      {showModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add new task"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              width: 'min(560px,100%)',
              boxShadow: '0 12px 48px -8px rgba(0,0,0,0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer'
              }}
              title="Close"
            >✕</button>
            <h3 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 20, color: '#22223b' }}>
              Add New Task
            </h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (!modalTitle.trim()) return;
              setTodos(prev => [
                ...prev,
                {
                  id: Date.now(),
                  title: modalTitle.trim(),
                  dueDate: modalDue || null,
                  course: modalCategory === '__new__' ? newCategory.trim() : modalCategory,
                  done: false
                }
              ]);
              setShowModal(false);
              setModalTitle("");
              setModalDue("");
              setModalCategory("");
              setNewCategory("");
            }}>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="todo-title" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Title</label>
                <input id="todo-title" value={modalTitle} onChange={e => setModalTitle(e.target.value)} required placeholder="Task title..." style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="todo-due-date" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Due Date</label>
                <input id="todo-due-date" type="datetime-local" value={modalDue} onChange={e => setModalDue(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="todo-category" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Category</label>
                <select id="todo-category" value={modalCategory} onChange={e => setModalCategory(e.target.value)} required style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', marginBottom: 8 }}>
                  <option value="" disabled>Select category...</option>
                  {addCategoryList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__new__">+ Create new category</option>
                </select>
                {modalCategory === '__new__' && (
                  <input id="todo-new-category" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name..." style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', marginTop: 6 }} />
                )}
              </div>
              <button type="submit" style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: '#22223b', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Add Task</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div style={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        paddingRight: 8,
        scrollbarWidth: 'thin',
        position: 'relative',
        WebkitOverflowScrolling: 'touch',
      }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered
            .sort((a, b) => {
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate) - new Date(b.dueDate);
            })
            .map(todo => {
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
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Due: {new Date(todo.dueDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {todo.source !== 'canvas' && (
                    <button onClick={() => deleteTodo(todo.id)} style={{
                      marginLeft: 10,
                      background: "#fff",
                      border: "1.5px solid #f87171",
                      color: "#f87171",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background 0.2s, color 0.2s, border 0.2s"
                    }} title="Delete task">✕</button>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

export default TodoWidget;
