import React, { useState, useEffect } from "react";
import { supabase } from "../auth/supabaseClient";

export default function NotesWidget() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Check logged in user and fetch notes
  // Currently Delete/Add/Edit are available when logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        fetchNotes(user.id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("Notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() || !user || saving) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("Notes")
        .insert([{
          user_id: user.id,
          content: newNote.trim()
        }])
        .select();

      if (error) {
        console.error("Error saving note:", error);
      } else {
        setNotes([data[0], ...notes]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateNote = async (noteId, newContent) => {
    try {
      const { error } = await supabase
        .from("Notes")
        .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", noteId);

      if (error) {
        console.error("Error updating note:", error);
      } else {
        setNotes(notes.map(note => 
          note.id === noteId 
            ? { ...note, content: newContent.trim(), updated_at: new Date().toISOString() }
            : note
        ));
        setEditingId(null);
        setEditContent("");
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const deleteNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from("Notes")
        .delete()
        .eq("id", noteId);

      if (error) {
        console.error("Error deleting note:", error);
      } else {
        setNotes(notes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveNote();
    }
  };

  // From here, code below is styling and rendering
  if (loading) {
    return (
      <div style={{ color: "black", opacity: 0.7, padding: 8 }}>
        Loading notes...
      </div>
    );
  }

  // Assume user is logged in to access widgets
  if (!user) {
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          Quick note
        </label>
        <div style={{ 
          color: "white", 
          opacity: 0.7, 
          padding: 8,
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)"
        }}>
          Please log in to use notes
        </div>
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
        Quick note
      </label>
      
      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        rows={6}
        placeholder="Type here… (Ctrl+Enter to save)"
        disabled={saving}
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          // Last digits control opacity, currently set low to not too distracting
          // left is while the text is being saved
          background: saving ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
          color: "black",
          outline: "none",
          resize: "vertical",
          opacity: saving ? 0.6 : 1
        }}
      />
      
      <button
        onClick={saveNote}
        disabled={!newNote.trim() || saving}
        style={{
          marginTop: 8,
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.12)",
          background: (newNote.trim() && !saving) ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
          color: "black",
          cursor: (newNote.trim() && !saving) ? "pointer" : "not-allowed",
          opacity: (newNote.trim() && !saving) ? 1 : 0.5,
          fontSize: 12
        }}
      >
        {saving ? "Saving..." : "Save Note"}
      </button>

      {notes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            Saved notes ({notes.length})
          </label>
          
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {notes.map((note) => (
              <div 
                key={note.id}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)"
                }}
              >
                {editingId === note.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: 60,
                        padding: 6,
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.1)",
                        color: "black",
                        outline: "none",
                        resize: "vertical",
                        marginBottom: 6
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => updateNote(note.id, editContent)}
                        disabled={!editContent.trim()}
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(100,255,100,0.3)",
                          background: editContent.trim() ? "rgba(100,255,100,0.1)" : "rgba(100,255,100,0.05)",
                          color: editContent.trim() ? "#22aa22" : "rgba(170,255,170,0.3)",
                          cursor: editContent.trim() ? "pointer" : "not-allowed"
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 4,
                           border: "1px solid rgba(255,100,100,0.3)",
                          background: "rgba(255,100,100,0.1)",
                          color: "#ffaaaa",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      color: "black", 
                      fontSize: 13, 
                      marginBottom: 6,
                      lineHeight: 1.4,
                      whiteSpace: "pre-wrap"
                    }}>
                      {note.content}
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center" 
                    }}>
                      <span style={{ fontSize: 11, opacity: 0.5, color: "black" }}>
                        {new Date(note.created_at).toLocaleString()}
                        {note.updated_at !== note.created_at && (
                          <span style={{ fontStyle: "italic" }}> (edited)</span>
                        )}
                      </span>
                      
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => startEdit(note)}
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(100,150,255,0.3)",
                            background: "rgba(100,150,255,0.1)",
                            color: "#000000ff",
                            cursor: "pointer"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = "rgba(100,150,255,0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = "rgba(100,150,255,0.1)";
                          }}
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteNote(note.id)}
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(255,100,100,0.3)",
                            background: "rgba(255,100,100,0.1)",
                            color: "#ffaaaa",
                            cursor: "pointer"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = "rgba(255,100,100,0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = "rgba(255,100,100,0.1)";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          textAlign: "center", 
          opacity: 0.5, 
          fontSize: 12,
          color: "white"
        }}>
          No saved notes yet. Write your first note above
        </div>
      )}
    </div>
  );
}