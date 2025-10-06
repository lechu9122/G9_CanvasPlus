import React, { useState } from "react";
import { createPortal } from "react-dom";

function TodoWidget() {
  const [fadingIds, setFadingIds] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDue, setModalDue] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalClass, setModalClass] = useState("");

  // Filtering logic
  let filtered = [...todos];
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
      filtered = filtered.filter(t => {
        const d = t.due_date || t.dueDate; // support both
        return d && new Date(d) >= minDate && new Date(d) < maxDate;
      });
    }
  }

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

  // Always allow deleting (remove Canvas restriction)
  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'salmon' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      {/* Obvious done/undone animations */}
      <style>
        {`
          @keyframes check-pop {
            0% { transform: scale(0.6); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
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
                  description: modalDescription.trim(),
                  due_date: modalDue || null,
                  class: modalClass.trim(),
                  done: false
                }
              ]);
              setShowModal(false);
              setModalTitle("");
              setModalDescription("");
              setModalDue("");
              setModalClass("");
            }}>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="todo-title" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Title</label>
                <input id="todo-title" value={modalTitle} onChange={e => setModalTitle(e.target.value)} required placeholder="Task title..." style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="todo-description" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Description</label>
                <textarea id="todo-description" value={modalDescription} onChange={e => setModalDescription(e.target.value)} placeholder="Optional details..." rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="todo-due-date" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Due Date</label>
                <input id="todo-due-date" type="datetime-local" value={modalDue} onChange={e => setModalDue(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="todo-class" style={{ fontSize: 14, fontWeight: 500, color: '#22223b', marginBottom: 4, display: 'block' }}>Class</label>
                <input id="todo-class" value={modalClass} onChange={e => setModalClass(e.target.value)} placeholder="Class (optional)..." style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }} />
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
              const ad = a.due_date || a.dueDate;
              const bd = b.due_date || b.dueDate;
              if (!ad && !bd) return 0;
              if (!ad) return 1;
              if (!bd) return -1;
              return new Date(ad) - new Date(bd);
            })
            .map(todo => {
              return (
                <li
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: 12,
                    background: "#fff",
                    color: todo.done ? "#888" : "#222",
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    position: "relative",
                    transition: "opacity 0.35s, transform 0.35s",
                    opacity: fadingIds.includes(todo.id) ? 0 : 1,
                    transform: fadingIds.includes(todo.id) ? 'translateY(30px)' : 'translateY(0)',
                    pointerEvents: fadingIds.includes(todo.id) ? 'none' : 'auto',
                  }}
                >
                  <button
                    type="button"
                    role="checkbox"                       
                    aria-checked={todo.done}              
                    aria-label={todo.done ? "Mark as undone" : "Mark as done"}
                    onClick={() => toggleTodo(todo.id)}
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
                      cursor: 'pointer', // keep clickable even when done (for undo)
                      marginTop: 2,
                      marginRight: 12,
                      position: 'relative',
                      outline: 'none',
                      transition: 'transform 120ms ease, background 0.2s, border 0.2s, box-shadow 0.2s',
                      padding: 0,
                      overflow: 'visible',
                      transform: todo.done ? 'scale(0.98)' : 'scale(1)',
                      boxShadow: todo.done
                        ? '0 0 0 3px rgba(34,197,94,0.25), 0 4px 10px rgba(0,0,0,0.08)'
                        : '0 0 0 0 rgba(0,0,0,0)'
                    }}
                  >
                    {/* Check icon: animated and high-contrast when done */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke={todo.done ? '#fff' : '#94a3b8'}  
                      strokeWidth={todo.done ? 2.8 : 2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        display: 'block',
                        opacity: todo.done ? 1 : 0.55,       
                        filter: todo.done ? 'drop-shadow(0 1px 0 rgba(0,0,0,0.25))' : 'none',
                        animation: todo.done ? 'check-pop 180ms ease-out' : 'none'
                      }}
                      aria-hidden="true"
                    >
                      <polyline points="5 11 9 15 15 7" />
                    </svg>
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
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>
                      {todo.class || todo.course /* prefer class */}
                    </div>
                    {(todo.due_date || todo.dueDate) && (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Due: {new Date(todo.due_date || todo.dueDate).toLocaleString()}
                      </div>
                    )}
                    {/* Optionally show description */}
                    {todo.description && (
                      <div style={{ fontSize: 13, opacity: todo.done ? 0.6 : 0.9, marginBottom: 4, whiteSpace: 'pre-wrap' }}>
                        {todo.description}
                      </div>
                    )}
                  </div>
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
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

export default TodoWidget;
