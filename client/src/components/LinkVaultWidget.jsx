import React, { useState, useEffect } from "react";
import { supabase } from "../auth/supabaseClient";

function LinkVaultWidget() {
  const [links, setLinks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLink, setNewLink] = useState({ url: "", title: "", category: "" });
  const [user, setUser] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        fetchLinks(user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setLoading(false);
    }
  };

  const fetchLinks = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("Links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
      } else {
        setLinks(data || []);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.url.trim() || !user) return;

    try {
      // Extract category from tags array or use the category input
      const tags = newLink.category.trim() ? [newLink.category.trim()] : [];

      const { data, error } = await supabase
        .from("Links")
        .insert([{
          user_id: user.id,
          title: newLink.title.trim() || newLink.url.trim(),
          url: newLink.url.trim(),
          tags: tags
        }])
        .select();

      if (error) {
        console.error("Error saving link:", error);
      } else {
        setLinks([data[0], ...links]);
        setNewLink({ url: "", title: "", category: "" });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Error saving link:", error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      const { error } = await supabase
        .from("Links")
        .delete()
        .eq("id", linkId);

      if (error) {
        console.error("Error deleting link:", error);
      } else {
        setLinks(links.filter(link => link.id !== linkId));
      }
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  // Get unique categories from tags array
  const categories = ["all", ...Array.from(new Set(
    links.flatMap(l => l.tags || []).filter(Boolean)
  ))];

  // Filter links by category (checking tags array)
  const filteredLinks = categoryFilter === "all"
    ? links
    : links.filter(l => l.tags && l.tags.includes(categoryFilter));

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Please log in to manage your links.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      {/* Header with controls */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 700, color: '#22223b' }}>
          Link Vault
        </h2>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#22223b',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.target.style.background = '#1a1a2e'}
            onMouseOut={e => e.target.style.background = '#22223b'}
          >
            + Add Link
          </button>

          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid #ddd',
                fontSize: 14,
                cursor: 'pointer',
                background: '#22223b'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 14, color: '#333' }}>
            {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
          </span>
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}
          onClick={() => setShowAddModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700, color: '#22223b' }}>
              Add New Link
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#333' }}>
                URL *
              </label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 7,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  color: '#fff'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#333' }}>
                Title
              </label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Favorite Website"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 7,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#333' }}>
                Category
              </label>
              <input
                type="text"
                value={newLink.category}
                onChange={(e) => setNewLink(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Work, Personal, Resources..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 7,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 7,
                  border: '1px solid #ddd',
                  color: '#333',
                  background: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                disabled={!newLink.url.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 7,
                  border: 'none',
                  background: newLink.url.trim() ? '#22223b' : '#ccc',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: newLink.url.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links List */}
      <div>
        {filteredLinks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
            fontSize: 15
          }}>
            {links.length === 0 ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
                <div>No links yet. Click "Add Link" to get started!</div>
              </>
            ) : (
              <div>No links in this category.</div>
            )}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredLinks.map(link => (
              <li
                key={link.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#22223b',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: 4
                      }}
                      onMouseOver={e => e.target.style.color = '#4a4a7a'}
                      onMouseOut={e => e.target.style.color = '#22223b'}
                    >
                      {link.title}
                    </a>
                    <div style={{
                      fontSize: 13,
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 6
                    }}>
                      {link.url}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                      {link.tags && link.tags.length > 0 && link.tags.map((tag, idx) => (
                        <span key={idx} style={{
                          background: '#f0f0f5',
                          color: '#22223b',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          {tag}
                        </span>
                      ))}
                      <span style={{ color: '#999' }}>
                        Added {new Date(link.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      fontSize: 18,
                      cursor: 'pointer',
                      padding: 4,
                      lineHeight: 1,
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={e => e.target.style.color = '#ff4444'}
                    onMouseOut={e => e.target.style.color = '#999'}
                    title="Delete link"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default LinkVaultWidget;