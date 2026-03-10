import React, { useState, useEffect } from 'react';
import Modal from './components/Modal';

const TTYD_URL = 'http://localhost:7682';
const STORAGE_KEY_TERMINALS = 'web-terminal-terminals';
const STORAGE_KEY_ACTIVE = 'web-terminal-active';

// Terminal color options
const TERMINAL_COLORS = [
  { emoji: '🟢', name: 'green', class: 'color-green' },
  { emoji: '🟡', name: 'yellow', class: 'color-yellow' },
  { emoji: '🔵', name: 'blue', class: 'color-blue' },
  { emoji: '🟣', name: 'purple', class: 'color-purple' },
  { emoji: '🟠', name: 'orange', class: 'color-orange' },
  { emoji: '🔴', name: 'red', class: 'color-red' },
];

function App() {
  const [terminals, setTerminals] = useState([]);
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [colorPickerId, setColorPickerId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTerminalName, setNewTerminalName] = useState('');

  // ==================== SESSION PERSISTENCE ====================
  // Load terminals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TERMINALS);
    if (saved) {
      try {
        const parsedTerminals = JSON.parse(saved);
        // Migrate old terminals without color
        const migratedTerminals = parsedTerminals.map((t, i) => ({
          ...t,
          color: t.color || TERMINAL_COLORS[i % TERMINAL_COLORS.length].name,
          emoji: t.emoji || TERMINAL_COLORS[i % TERMINAL_COLORS.length].emoji
        }));
        setTerminals(migratedTerminals);

        // Restore active terminal
        const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
        if (savedActive) {
          const activeId = parseInt(savedActive, 10);
          // Only set active if the terminal still exists
          if (parsedTerminals.some(t => t.id === activeId)) {
            setActiveTerminal(activeId);
          } else if (parsedTerminals.length > 0) {
            // If saved terminal doesn't exist, use first one
            setActiveTerminal(parsedTerminals[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage:', e);
      }
    }
  }, []);

  // Save terminals to localStorage whenever they change
  useEffect(() => {
    if (terminals.length > 0) {
      localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(terminals));
    } else {
      // Clear storage if no terminals
      localStorage.removeItem(STORAGE_KEY_TERMINALS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }, [terminals]);

  // Save active terminal to localStorage whenever it changes
  useEffect(() => {
    if (activeTerminal !== null) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeTerminal.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }, [activeTerminal]);

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when editing or typing in input
      if (editingId !== null || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+N or Ctrl+T: Open new terminal
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N' || e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        addTerminal();
        return;
      }

      // Ctrl+W: Close current terminal
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        if (activeTerminal) {
          removeTerminal(activeTerminal, e);
        }
        return;
      }

      // Ctrl+1 to Ctrl+9: Switch to specific terminal
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < terminals.length && terminals[index]) {
          setActiveTerminal(terminals[index].id);
        }
        return;
      }

      // Escape: Cancel editing if currently editing
      if (e.key === 'Escape' && editingId !== null) {
        e.preventDefault();
        cancelEdit();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [terminals, activeTerminal, editingId, editingName, isAddModalOpen]);

  const addTerminal = () => {
    // Open modal instead of prompt
    setNewTerminalName(`Terminal ${terminals.length + 1}`);
    setIsAddModalOpen(true);
  };

  const confirmAddTerminal = () => {
    const trimmedName = newTerminalName.trim();
    if (!trimmedName) {
      alert('Terminal name cannot be empty');
      return;
    }
    const id = Date.now();
    // Auto-assign color based on existing terminals
    const colorIndex = terminals.length % TERMINAL_COLORS.length;
    const terminal = {
      id,
      name: trimmedName,
      status: 'active',
      color: TERMINAL_COLORS[colorIndex].name,
      emoji: TERMINAL_COLORS[colorIndex].emoji
    };
    setTerminals([...terminals, terminal]);
    setActiveTerminal(id);
    setIsAddModalOpen(false);
    setNewTerminalName('');
  };

  const cancelAddTerminal = () => {
    setIsAddModalOpen(false);
    setNewTerminalName('');
  };

  const removeTerminal = (id, e) => {
    e.stopPropagation();
    
    // ==================== CONFIRM BEFORE CLOSE ====================
    // Show confirmation dialog before closing
    const shouldClose = window.confirm(
      `Are you sure you want to close "${terminals.find(t => t.id === id)?.name}"?\n\nYour session will be lost.`
    );
    
    if (!shouldClose) {
      return; // User cancelled
    }
    
    const newTerminals = terminals.filter(t => t.id !== id);
    setTerminals(newTerminals);
    
    // Update active terminal if we closed the active one
    if (activeTerminal === id) {
      if (newTerminals.length > 0) {
        // Try to activate the previous terminal, or the first one
        const currentIndex = terminals.findIndex(t => t.id === id);
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        setActiveTerminal(newTerminals[nextIndex]?.id || newTerminals[0].id);
      } else {
        setActiveTerminal(null);
      }
    }
  };

  const startEditing = (id, e) => {
    e.stopPropagation();
    const terminal = terminals.find(t => t.id === id);
    if (terminal) {
      setEditingId(id);
      setEditingName(terminal.name);
    }
  };

  const saveEdit = (id) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      alert('Terminal name cannot be empty');
      return;
    }
    setTerminals(terminals.map(t =>
      t.id === id ? { ...t, name: trimmedName } : t
    ));
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleEditKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // ==================== TERMINAL COLORS ====================
  const changeTerminalColor = (id, colorName) => {
    const color = TERMINAL_COLORS.find(c => c.name === colorName);
    if (color) {
      setTerminals(terminals.map(t =>
        t.id === id ? { ...t, color: color.name, emoji: color.emoji } : t
      ));
    }
    setColorPickerId(null);
  };

  // ==================== SEARCH ====================
  const filteredTerminals = terminals.filter(terminal =>
    terminal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-left">
          <div className="sidebar-header">
            🖥️
          </div>
          <button 
            className="add-terminal" 
            onClick={addTerminal}
            title="Add Terminal (Ctrl+N or Ctrl+T)"
          >
            +
          </button>
        </div>
        <div className="sidebar-right">
          {/* Search Input */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search terminals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="terminal-list">
            {filteredTerminals.map((terminal, index) => (
              <div
                key={terminal.id}
                className={`terminal-item ${activeTerminal === terminal.id ? 'active' : ''}`}
                onClick={() => setActiveTerminal(terminal.id)}
                title={`Switch to ${terminal.name} (Ctrl+${index + 1})`}
              >
                {editingId === terminal.id ? (
                  <input
                    type="text"
                    className="terminal-name-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveEdit(terminal.id)}
                    onKeyDown={(e) => handleEditKeyPress(e, terminal.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="terminal-emoji" onClick={(e) => { e.stopPropagation(); setColorPickerId(terminal.id); }}>
                      {terminal.emoji || '⚪'}
                    </span>
                    <span
                      className="terminal-name"
                      onDoubleClick={(e) => startEditing(terminal.id, e)}
                      title="Double-click to rename"
                    >
                      {terminal.name}
                    </span>
                  </>
                )}
                {colorPickerId === terminal.id && (
                  <div className="color-picker" onClick={(e) => e.stopPropagation()}>
                    {TERMINAL_COLORS.map(color => (
                      <button
                        key={color.name}
                        className={`color-option ${color.class} ${terminal.color === color.name ? 'selected' : ''}`}
                        onClick={() => changeTerminalColor(terminal.id, color.name)}
                        title={color.name}
                      >
                        {color.emoji}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="terminal-status" title="Active"></span>
                  <button
                    className="close-terminal"
                    onClick={(e) => removeTerminal(terminal.id, e)}
                    title={`Close terminal (Ctrl+W)`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {filteredTerminals.length === 0 && searchQuery && (
              <div className="no-results">
                No terminals found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="main-content">
        {activeTerminal ? (
          <div className="terminal-container">
            {terminals.map(terminal => (
              <iframe
                key={terminal.id}
                src={`${TTYD_URL}?id=${terminal.id}`}
                className={`terminal-iframe ${activeTerminal === terminal.id ? 'active' : ''}`}
                title={terminal.name}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div>
              <p>No terminal selected</p>
              <p style={{ marginTop: '10px', fontSize: '12px' }}>
                Click "+ Add Terminal" or press <strong>Ctrl+N</strong> to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Terminal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={cancelAddTerminal}
        title="Add New Terminal"
      >
        <div className="add-terminal-form">
          <input
            type="text"
            className="modal-input"
            placeholder="Enter terminal name..."
            value={newTerminalName}
            onChange={(e) => setNewTerminalName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAddTerminal();
              }
            }}
            autoFocus
          />
          <div className="modal-actions">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={cancelAddTerminal}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-primary"
              onClick={confirmAddTerminal}
            >
              Add Terminal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
