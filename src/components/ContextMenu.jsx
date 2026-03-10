import React, { useEffect, useRef } from 'react';

function ContextMenu({ isOpen, x, y, onClose, onRename, onChangeColor, onMoveToGroup, onDuplicate, onCloseTerminal, availableGroups }) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
        <div className="context-menu-item" onClick={() => { onRename(); onClose(); }}>
          ✏️ Rename
        </div>
        <div className="context-menu-item" onClick={() => { onChangeColor(); onClose(); }}>
          🎨 Change Color
        </div>
        {availableGroups && availableGroups.length > 1 && (
          <div className="context-menu-submenu">
            <div className="context-menu-item">📁 Move to Group</div>
            <div className="context-menu-submenu-items">
              {availableGroups.map(group => (
                <div
                  key={group.id}
                  className="context-menu-item"
                  onClick={() => { onMoveToGroup(group.id); onClose(); }}
                >
                  {group.name}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="context-menu-item" onClick={() => { onDuplicate(); onClose(); }}>
          📋 Duplicate
        </div>
        <div className="context-menu-divider"></div>
        <div className="context-menu-item context-menu-danger" onClick={() => { onCloseTerminal(); onClose(); }}>
          ✕ Close Terminal
        </div>
    </div>
  );
}

export default ContextMenu;
