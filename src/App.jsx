import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from './components/Modal';
import TerminalWrapper from './components/TerminalWrapper';
import SortableTerminalList from './components/SortableTerminalList';
import ContextMenu from './components/ContextMenu';
import TemplateModal from './components/TemplateModal';
import ProfileModal from './components/ProfileModal';

// ==================== CONSTANTS ====================
const TTYD_URL = 'http://localhost:7682';

// Storage keys
const STORAGE_KEY_TERMINALS = 'web-terminal-terminals';
const STORAGE_KEY_ACTIVE = 'web-terminal-active';
const STORAGE_KEY_GROUPS = 'web-terminal-groups';
const STORAGE_KEY_TEMPLATES = 'web-terminal-templates';
const STORAGE_KEY_PROFILES = 'web-terminal-profiles';
const STORAGE_KEY_ALL = 'web-terminal-all'; // Combined storage for efficiency

// Timing constants (milliseconds)
const RECONNECT_DELAY_MS = 3000;
const STORAGE_DEBOUNCE_MS = 300;

// Validation constants
const MAX_TERMINAL_NAME_LENGTH = 100;
const MAX_GROUP_NAME_LENGTH = 50;

// Terminal color options
const TERMINAL_COLORS = [
  { emoji: '🟢', name: 'green', class: 'color-green' },
  { emoji: '🟡', name: 'yellow', class: 'color-yellow' },
  { emoji: '🔵', name: 'blue', class: 'color-blue' },
  { emoji: '🟣', name: 'purple', class: 'color-purple' },
  { emoji: '🟠', name: 'orange', class: 'color-orange' },
  { emoji: '🔴', name: 'red', class: 'color-red' },
];

// ==================== STORAGE UTILITIES ====================
// Debounced storage write to batch multiple writes
const useDebouncedStorage = (delay = STORAGE_DEBOUNCE_MS) => {
  const timeoutRef = useRef(null);
  const pendingDataRef = useRef(null);

  const scheduleWrite = useCallback((data) => {
    // Store the latest data
    pendingDataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new write
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY_ALL, JSON.stringify(pendingDataRef.current));
        } catch (error) {
          console.error('Failed to write to localStorage:', error);
        }
        pendingDataRef.current = null;
      }
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Write any pending data
      if (pendingDataRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY_ALL, JSON.stringify(pendingDataRef.current));
        } catch (error) {
          console.error('Failed to write pending data:', error);
        }
      }
    };
  }, []);

  return scheduleWrite;
};

// Load all data at once (more efficient)
const loadAllData = () => {
  try {
    // Try new combined storage first
    const allData = localStorage.getItem(STORAGE_KEY_ALL);
    if (allData) {
      const parsed = JSON.parse(allData);
      return {
        terminals: parsed.terminals || [],
        groups: parsed.groups || [{ id: 'default', name: 'Default', expanded: true }],
        activeTerminal: parsed.activeTerminal || null,
        templates: parsed.templates || [],
        profiles: parsed.profiles || []
      };
    }

    // Fallback to legacy separate keys
    const terminals = localStorage.getItem(STORAGE_KEY_TERMINALS);
    const groups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const templates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    const profiles = localStorage.getItem(STORAGE_KEY_PROFILES);

    return {
      terminals: terminals ? JSON.parse(terminals) : [],
      groups: groups ? JSON.parse(groups) : [{ id: 'default', name: 'Default', expanded: true }],
      activeTerminal: active ? parseInt(active, 10) : null,
      templates: templates ? JSON.parse(templates) : [],
      profiles: profiles ? JSON.parse(profiles) : []
    };
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return {
      terminals: [],
      groups: [{ id: 'default', name: 'Default', expanded: true }],
      activeTerminal: null,
      templates: [],
      profiles: []
    };
  }
};

function App() {
  // State
  const [groups, setGroups] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [colorPickerId, setColorPickerId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTerminalName, setNewTerminalName] = useState('');
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, terminalId: null });
  const [terminalStatuses, setTerminalStatuses] = useState({});
  const [splitMode, setSplitMode] = useState(null);
  const [secondaryTerminal, setSecondaryTerminal] = useState(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [commandTemplates, setCommandTemplates] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [terminalProfiles, setTerminalProfiles] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showProfiles, setShowProfiles] = useState(true);
  const [iframeRefs, setIframeRefs] = useState({});
  const [autoReconnect, setAutoReconnect] = useState(true);

  // ==================== EFFICIENT STORAGE ====================
  // Single debounced storage write instead of 6 separate effects
  const scheduleStorageWrite = useDebouncedStorage(STORAGE_DEBOUNCE_MS);

  // Write all data to storage in a single batched operation
  const saveToStorage = useCallback(() => {
    scheduleStorageWrite({
      version: '1.0',
      terminals,
      groups,
      activeTerminal,
      templates: commandTemplates,
      profiles: terminalProfiles,
      savedAt: Date.now()
    });
  }, [terminals, groups, activeTerminal, commandTemplates, terminalProfiles, scheduleStorageWrite]);

  // Save whenever any tracked state changes
  useEffect(() => {
    saveToStorage();
  }, [saveToStorage]);

  // ==================== SECURITY UTILITIES ====================
  // Sanitize ID for safe URL construction
  const sanitizeId = (id) => {
    // Ensure ID is a number and convert to string safely
    const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (isNaN(numId) || numId <= 0) {
      throw new Error('Invalid terminal ID');
    }
    return String(numId);
  };

  // Safely parse JSON with validation
  const safeJsonParse = (json, fallback = null, validator = null) => {
    try {
      const data = JSON.parse(json);
      // Run custom validator if provided
      if (validator && !validator(data)) {
        console.warn('JSON validation failed, using fallback');
        return fallback;
      }
      return data;
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return fallback;
    }
  };

  // Validate terminal data structure
  const isValidTerminal = (item) => {
    return item &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      item.id > 0 &&
      typeof item.name === 'string' &&
      item.name.length > 0 &&
      item.name.length <= MAX_TERMINAL_NAME_LENGTH;
  };

  // Validate session data structure
  const isValidSessionData = (data) => {
    return data &&
      typeof data === 'object' &&
      data.version &&
      typeof data.version === 'string' &&
      Array.isArray(data.terminals);
  };

  // ==================== TERMINAL STATUS TRACKING ====================
  // Update terminal connection status
  const updateTerminalStatus = (terminalId, status) => {
    setTerminalStatuses(prev => ({
      ...prev,
      [terminalId]: status
    }));
  };

  const handleTerminalLoad = (terminalId) => {
    updateTerminalStatus(terminalId, 'connected');
  };

  const handleTerminalError = (terminalId) => {
    updateTerminalStatus(terminalId, 'disconnected');

    // Auto-reconnect if enabled
    if (autoReconnect) {
      setTimeout(() => {
        attemptReconnect(terminalId);
      }, RECONNECT_DELAY_MS);
    }
  };

  // Attempt to reconnect a disconnected terminal
  const attemptReconnect = (terminalId) => {
    try {
      const safeId = sanitizeId(terminalId);
      const iframe = document.querySelector(`iframe[data-terminal-id="${safeId}"]`);
      if (iframe) {
        // Force reload the iframe with sanitized ID
        updateTerminalStatus(terminalId, 'loading');
        iframe.src = `${TTYD_URL}?id=${safeId}&reconnect=${Date.now()}`;
      }
    } catch (error) {
      console.error('Failed to reconnect terminal:', error);
      updateTerminalStatus(terminalId, 'disconnected');
    }
  };

  // ==================== SPLIT VIEW ====================
  const toggleSplitView = (mode) => {
    if (splitMode === mode) {
      // Turn off split view
      setSplitMode(null);
      setSecondaryTerminal(null);
    } else {
      // Turn on split view
      if (terminals.length < 2) {
        alert('Need at least 2 terminals for split view');
        return;
      }
      setSplitMode(mode);
      // Set secondary terminal to first non-active terminal
      const otherTerminal = terminals.find(t => t.id !== activeTerminal);
      if (otherTerminal) {
        setSecondaryTerminal(otherTerminal.id);
      }
    }
  };

  const handleSplitMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = splitPosition;

    const handleMouseMove = (moveEvent) => {
      if (splitMode === 'vertical') {
        const container = document.querySelector('.split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newPosition = ((moveEvent.clientX - rect.left) / rect.width) * 100;
          setSplitPosition(Math.max(20, Math.min(80, newPosition)));
        }
      } else {
        // horizontal
        const container = document.querySelector('.split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newPosition = ((moveEvent.clientY - rect.top) / rect.height) * 100;
          setSplitPosition(Math.max(20, Math.min(80, newPosition)));
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ==================== COMMAND TEMPLATES ====================
  const addTemplate = (template) => {
    const newTemplate = {
      id: Date.now(),
      ...template,
      createdAt: new Date().toISOString()
    };
    setCommandTemplates([...commandTemplates, newTemplate]);
  };

  const updateTemplate = (id, updatedTemplate) => {
    setCommandTemplates(commandTemplates.map(t =>
      t.id === id ? { ...t, ...updatedTemplate } : t
    ));
  };

  const deleteTemplate = (id) => {
    setCommandTemplates(commandTemplates.filter(t => t.id !== id));
  };

  const executeTemplate = (templateId) => {
    if (!activeTerminal) {
      alert('Please select a terminal first');
      return;
    }
    const template = commandTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Find the active terminal iframe and send the command
    const iframe = document.querySelector(`.terminal-iframe.active iframe`);
    if (iframe && iframe.contentWindow) {
      // Send command via postMessage (ttyd will need to handle this)
      // For now, we'll use a simpler approach - the user can copy-paste
      // In a real implementation, we'd need a backend that accepts commands
      alert(`Template: ${template.name}\nCommand: ${template.command}\n\nNote: Copy this command to the terminal to execute.`);
    }
  };

  const openTemplateModal = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  // ==================== TERMINAL PROFILES ====================
  const addProfile = (profile) => {
    const newProfile = {
      id: Date.now(),
      ...profile,
      createdAt: new Date().toISOString()
    };
    setTerminalProfiles([...terminalProfiles, newProfile]);
  };

  const updateProfile = (id, updatedProfile) => {
    setTerminalProfiles(terminalProfiles.map(p =>
      p.id === id ? { ...p, ...updatedProfile } : p
    ));
  };

  const deleteProfile = (id) => {
    setTerminalProfiles(terminalProfiles.filter(p => p.id !== id));
  };

  const createTerminalFromProfile = (profile) => {
    const id = Date.now();
    const colorIndex = terminals.length % TERMINAL_COLORS.length;
    const terminal = {
      id,
      groupId: groups[0]?.id || 'default',
      name: profile.name,
      status: 'loading',
      color: TERMINAL_COLORS[colorIndex].name,
      emoji: TERMINAL_COLORS[colorIndex].emoji,
      profileId: profile.id, // Link to profile
      shell: profile.shell,
      workingDir: profile.workingDir,
      envVars: profile.envVars,
      startupCmd: profile.startupCmd
    };
    setTerminals([...terminals, terminal]);
    setActiveTerminal(id);
    updateTerminalStatus(id, 'loading');
  };

  const openProfileModal = () => {
    setEditingProfile(null);
    setIsProfileModalOpen(true);
  };

  const openEditProfile = (profile) => {
    setEditingProfile(profile);
    setIsProfileModalOpen(true);
  };

  // ==================== EXPORT / IMPORT SESSIONS ====================
  const exportSession = () => {
    const sessionData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      terminals: terminals.map(t => ({
        id: t.id,
        name: t.name,
        groupId: t.groupId,
        color: t.color,
        emoji: t.emoji,
        // Don't include connection-specific data like shell, workingDir, etc.
        // Those should come from profiles
        profileId: t.profileId
      })),
      groups: groups,
      commandTemplates: commandTemplates,
      terminalProfiles: terminalProfiles
    };

    // Create a blob and download
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-terminal-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSession = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Use safe JSON parsing with validation
      const sessionData = safeJsonParse(
        e.target.result,
        null,
        isValidSessionData
      );

      if (!sessionData) {
        alert('Invalid session file format');
        return;
      }

      // Validate and filter terminals
      const validTerminals = sessionData.terminals ? sessionData.terminals.filter(isValidTerminal) : [];
      if (validTerminals.length !== sessionData.terminals?.length) {
        console.warn(`Filtered out ${sessionData.terminals.length - validTerminals.length} invalid terminals`);
      }

      // Import data with validation
      if (sessionData.groups && Array.isArray(sessionData.groups)) {
        setGroups(sessionData.groups);
      }
      if (validTerminals.length > 0) {
        setTerminals(validTerminals);
      }
      if (sessionData.commandTemplates && Array.isArray(sessionData.commandTemplates)) {
        setCommandTemplates(sessionData.commandTemplates);
      }
      if (sessionData.terminalProfiles && Array.isArray(sessionData.terminalProfiles)) {
        setTerminalProfiles(sessionData.terminalProfiles);
      }

      // Reset active terminal
      if (validTerminals.length > 0) {
        setActiveTerminal(validTerminals[0].id);
      }

      alert(`Session imported successfully!\n\n${validTerminals.length} terminals\n${sessionData.groups?.length || 0} groups\n${sessionData.commandTemplates?.length || 0} templates\n${sessionData.terminalProfiles?.length || 0} profiles`);
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // ==================== LOAD DATA ON MOUNT ====================
  // Load all data at once on mount (efficient single read)
  useEffect(() => {
    const data = loadAllData();

    // Migrate and set terminals with color assignment
    const migratedTerminals = data.terminals.filter(isValidTerminal).map((t, i) => ({
      ...t,
      groupId: t.groupId || data.groups[0]?.id || 'default',
      color: t.color || TERMINAL_COLORS[i % TERMINAL_COLORS.length].name,
      emoji: t.emoji || TERMINAL_COLORS[i % TERMINAL_COLORS.length].emoji
    }));

    setGroups(data.groups);
    setTerminals(migratedTerminals);

    // Set active terminal
    if (data.activeTerminal && migratedTerminals.some(t => t.id === data.activeTerminal)) {
      setActiveTerminal(data.activeTerminal);
    } else if (migratedTerminals.length > 0) {
      setActiveTerminal(migratedTerminals[0].id);
    }

    setCommandTemplates(data.templates);
    setTerminalProfiles(data.profiles);
  }, []); // Empty deps = run once on mount

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
      groupId: groups[0]?.id || 'default',
      name: trimmedName,
      status: 'loading',
      color: TERMINAL_COLORS[colorIndex].name,
      emoji: TERMINAL_COLORS[colorIndex].emoji
    };
    setTerminals([...terminals, terminal]);
    setActiveTerminal(id);
    // Set initial status as loading
    updateTerminalStatus(id, 'loading');
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

  // ==================== GROUP MANAGEMENT ====================
  const addGroup = () => {
    setNewGroupName(`Group ${groups.length + 1}`);
    setIsAddGroupModalOpen(true);
  };

  const confirmAddGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      alert('Group name cannot be empty');
      return;
    }
    const group = {
      id: `group-${Date.now()}`,
      name: trimmedName,
      expanded: true
    };
    setGroups([...groups, group]);
    setIsAddGroupModalOpen(false);
    setNewGroupName('');
  };

  const removeGroup = (groupId) => {
    if (groups.length <= 1) {
      alert('Must have at least one group');
      return;
    }
    const groupTerminals = terminals.filter(t => t.groupId === groupId);
    if (groupTerminals.length > 0) {
      const confirm = window.confirm(
        `This group has ${groupTerminals.length} terminal(s). Remove anyway?`
      );
      if (!confirm) return;
      // Remove terminals in this group
      setTerminals(terminals.filter(t => t.groupId !== groupId));
    }
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const toggleGroupExpand = (groupId) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, expanded: !g.expanded } : g
    ));
  };

  const moveTerminalToGroup = (terminalId, newGroupId) => {
    setTerminals(terminals.map(t =>
      t.id === terminalId ? { ...t, groupId: newGroupId } : t
    ));
  };

  const getTerminalsByGroup = (groupId) => {
    return terminals.filter(t => t.groupId === groupId);
  };

  // ==================== CONTEXT MENU ====================
  const openContextMenu = (e, terminalId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      terminalId
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const contextMenuDuplicate = () => {
    if (!contextMenu.terminalId) return;
    const terminal = terminals.find(t => t.id === contextMenu.terminalId);
    if (!terminal) return;

    const id = Date.now();
    const colorIndex = terminals.length % TERMINAL_COLORS.length;
    const newTerminal = {
      id,
      groupId: terminal.groupId,
      name: `${terminal.name} (copy)`,
      status: 'active',
      color: TERMINAL_COLORS[colorIndex].name,
      emoji: TERMINAL_COLORS[colorIndex].emoji
    };
    setTerminals([...terminals, newTerminal]);
    setActiveTerminal(id);
  };

  const contextMenuRename = () => {
    if (!contextMenu.terminalId) return;
    const terminal = terminals.find(t => t.id === contextMenu.terminalId);
    if (terminal) {
      setEditingId(contextMenu.terminalId);
      setEditingName(terminal.name);
    }
  };

  const contextMenuClose = () => {
    if (!contextMenu.terminalId) return;
    // Create a fake event for removeTerminal
    removeTerminal(contextMenu.terminalId, { stopPropagation: () => {} });
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

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-left">
          <div className="sidebar-header" role="banner" aria-label="Web Terminal Sidebar">
            🖥️
          </div>
          <button
            className="add-terminal"
            onClick={addTerminal}
            title="Add Terminal (Ctrl+N or Ctrl+T)"
            aria-label="Add new terminal"
          >
            +
          </button>
          <button
            className="add-group"
            onClick={addGroup}
            title="Add Group"
            aria-label="Add new group"
          >
            📁
          </button>
          <button
            className={`split-toggle ${splitMode === 'vertical' ? 'active' : ''}`}
            onClick={() => toggleSplitView('vertical')}
            title="Split Vertical"
            aria-label="Split view vertically"
            aria-pressed={splitMode === 'vertical'}
          >
            ⋮
          </button>
          <button
            className={`split-toggle ${splitMode === 'horizontal' ? 'active' : ''}`}
            onClick={() => toggleSplitView('horizontal')}
            title="Split Horizontal"
            aria-label="Split view horizontally"
            aria-pressed={splitMode === 'horizontal'}
          >
            ≡
          </button>
          <button
            className="template-button"
            onClick={openTemplateModal}
            title="Command Templates"
            aria-label="Open command templates"
          >
            📋
          </button>
          <button
            className="profile-button"
            onClick={openProfileModal}
            title="Terminal Profiles"
            aria-label="Open terminal profiles"
          >
            ⚙️
          </button>
          <button
            className="export-button"
            onClick={exportSession}
            title="Export Session"
            aria-label="Export session data"
          >
            📤
          </button>
          <button
            className="import-button"
            onClick={() => document.getElementById('import-file-input').click()}
            title="Import Session"
            aria-label="Import session data"
          >
            📥
          </button>
          <input
            id="import-file-input"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importSession}
          />
        </div>
        <div className="sidebar-right">
          {/* Search Input */}
          <div className="search-container" role="search">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search terminals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search terminals"
              aria-controls="terminal-list"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Templates Section */}
          {commandTemplates.length > 0 && (
            <div className="templates-section">
              <div className="templates-header" onClick={() => setShowTemplates(!showTemplates)}>
                <span>📋 Templates</span>
                <span className="templates-count">({commandTemplates.length})</span>
              </div>
              {showTemplates && (
                <div className="templates-list">
                  {commandTemplates.map(template => (
                    <div
                      key={template.id}
                      className="template-item"
                      onClick={() => executeTemplate(template.id)}
                    >
                      <div className="template-info">
                        <span className="template-name">{template.name}</span>
                        {template.description && (
                          <span className="template-description">{template.description}</span>
                        )}
                      </div>
                      <div className="template-actions">
                        <button
                          className="template-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTemplate(template);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="template-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete template "${template.name}"?`)) {
                              deleteTemplate(template.id);
                            }
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profiles Section */}
          {terminalProfiles.length > 0 && (
            <div className="profiles-section">
              <div className="profiles-header" onClick={() => setShowProfiles(!showProfiles)}>
                <span>⚙️ Profiles</span>
                <span className="profiles-count">({terminalProfiles.length})</span>
              </div>
              {showProfiles && (
                <div className="profiles-list">
                  {terminalProfiles.map(profile => (
                    <div
                      key={profile.id}
                      className="profile-item"
                      onClick={() => createTerminalFromProfile(profile)}
                    >
                      <div className="profile-info">
                        <span className="profile-name">{profile.name}</span>
                        <span className="profile-details">
                          {profile.shell.split('/').pop()} • {profile.workingDir}
                        </span>
                      </div>
                      <div className="profile-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProfile(profile);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete profile "${profile.name}"?`)) {
                              deleteProfile(profile.id);
                            }
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <SortableTerminalList
            id="terminal-list"
            groups={groups}
            terminals={terminals}
            activeTerminal={activeTerminal}
            editingId={editingId}
            editingName={editingName}
            colorPickerId={colorPickerId}
            searchQuery={searchQuery}
            setActiveTerminal={setActiveTerminal}
            setEditingId={setEditingId}
            setEditingName={setEditingName}
            setColorPickerId={setColorPickerId}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            handleEditKeyPress={handleEditKeyPress}
            removeTerminal={removeTerminal}
            changeTerminalColor={changeTerminalColor}
            setTerminals={setTerminals}
            toggleGroupExpand={toggleGroupExpand}
            removeGroup={removeGroup}
            moveTerminalToGroup={moveTerminalToGroup}
            onContextMenu={openContextMenu}
            terminalStatuses={terminalStatuses}
          />
        </div>
      </div>
      <div className="main-content" role="main" aria-label="Terminal content area">
        {activeTerminal ? (
          splitMode ? (
            <div className={`split-container split-${splitMode}`} role="region" aria-label={`Split ${splitMode} view`}>
              <div className="split-pane" style={{ flex: splitPosition }} role="region" aria-label="Primary terminal">
                {terminals.map(terminal => {
                  if (terminal.id === activeTerminal) {
                    try {
                      const safeId = sanitizeId(terminal.id);
                      return (
                        <iframe
                          key={terminal.id}
                          src={`${TTYD_URL}?id=${safeId}`}
                          className="terminal-iframe active"
                          title={terminal.name}
                          data-terminal-id={safeId}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                          referrerPolicy="no-referrer"
                          allowFullScreen
                          allow="clipboard-read; clipboard-write; keyboard-input"
                          aria-label={`Terminal: ${terminal.name}`}
                          onLoad={() => handleTerminalLoad(terminal.id)}
                          onError={() => handleTerminalError(terminal.id)}
                        />
                      );
                    } catch (error) {
                      console.error('Invalid terminal ID:', error);
                      return null;
                    }
                  }
                  return null;
                })}
              </div>
              <div className="split-divider" onMouseDown={handleSplitMouseDown} role="separator" aria-orientation={splitMode === 'vertical' ? 'vertical' : 'horizontal'} aria-label="Split view divider">
                <div className={`split-handle split-${splitMode}`}></div>
              </div>
              <div className="split-pane" style={{ flex: 100 - splitPosition }} role="region" aria-label="Secondary terminal">
                {terminals.map(terminal => {
                  if (terminal.id === secondaryTerminal) {
                    try {
                      const safeId = sanitizeId(terminal.id);
                      return (
                        <iframe
                          key={terminal.id}
                          src={`${TTYD_URL}?id=${safeId}`}
                          className="terminal-iframe active"
                          title={terminal.name}
                          data-terminal-id={safeId}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                          referrerPolicy="no-referrer"
                          allowFullScreen
                          allow="clipboard-read; clipboard-write; keyboard-input"
                          aria-label={`Terminal: ${terminal.name}`}
                          onLoad={() => handleTerminalLoad(terminal.id)}
                          onError={() => handleTerminalError(terminal.id)}
                        />
                      );
                    } catch (error) {
                      console.error('Invalid terminal ID:', error);
                      return null;
                    }
                  }
                  return null;
                })}
              </div>
            </div>
          ) : (
            <div className="terminal-container" role="region" aria-label="Active terminal">
              {terminals.map(terminal => (
                <TerminalWrapper
                  key={terminal.id}
                  terminal={terminal}
                  isActive={activeTerminal === terminal.id}
                  onLoad={handleTerminalLoad}
                  onError={handleTerminalError}
                />
              ))}
            </div>
          )
        ) : (
          <div className="empty-state" role="status" aria-live="polite">
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

      {/* Add Group Modal */}
      <Modal
        isOpen={isAddGroupModalOpen}
        onClose={() => {
          setIsAddGroupModalOpen(false);
          setNewGroupName('');
        }}
        title="Add New Group"
      >
        <div className="add-terminal-form">
          <input
            type="text"
            className="modal-input"
            placeholder="Enter group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAddGroup();
              }
            }}
            autoFocus
          />
          <div className="modal-actions">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => {
                setIsAddGroupModalOpen(false);
                setNewGroupName('');
              }}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-primary"
              onClick={confirmAddGroup}
            >
              Add Group
            </button>
          </div>
        </div>
      </Modal>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={(template) => {
          if (editingTemplate) {
            updateTemplate(editingTemplate.id, template);
          } else {
            addTemplate(template);
          }
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={(profile) => {
          if (editingProfile) {
            updateProfile(editingProfile.id, profile);
          } else {
            addProfile(profile);
          }
          setIsProfileModalOpen(false);
          setEditingProfile(null);
        }}
        editingProfile={editingProfile}
        existingProfiles={terminalProfiles}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        onRename={contextMenuRename}
        onChangeColor={() => setColorPickerId(contextMenu.terminalId)}
        onMoveToGroup={(groupId) => moveTerminalToGroup(contextMenu.terminalId, groupId)}
        onDuplicate={contextMenuDuplicate}
        onCloseTerminal={contextMenuClose}
        availableGroups={groups}
      />
    </div>
  );
}

export default App;
