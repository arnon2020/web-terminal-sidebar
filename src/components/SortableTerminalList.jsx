import React, { memo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import colors
const TERMINAL_COLORS = [
  { emoji: '🟢', name: 'green', class: 'color-green' },
  { emoji: '🟡', name: 'yellow', class: 'color-yellow' },
  { emoji: '🔵', name: 'blue', class: 'color-blue' },
  { emoji: '🟣', name: 'purple', class: 'color-purple' },
  { emoji: '🟠', name: 'orange', class: 'color-orange' },
  { emoji: '🔴', name: 'red', class: 'color-red' },
];

// Memoized component to prevent unnecessary re-renders
const SortableTerminalItem = memo(function SortableTerminalItem({
  id,
  terminal,
  isActive,
  editingId,
  editingName,
  colorPickerId,
  onActivate,
  onDoubleClick,
  onEmojiClick,
  onRemove,
  onSaveEdit,
  onCancelEdit,
  onChangeName,
  onKeyDown,
  onChangeColor,
  onContextMenu,
  connectionStatus
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`terminal-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        // Don't activate if editing or clicking on specific elements
        if (editingId === terminal.id) return;
        onActivate(terminal.id);
      }}
      onContextMenu={(e) => onContextMenu(e, terminal.id)}
    >
      {editingId === terminal.id ? (
        <input
          type="text"
          className="terminal-name-input"
          value={editingName}
          onChange={(e) => onChangeName(e.target.value)}
          onBlur={() => onSaveEdit(terminal.id)}
          onKeyDown={(e) => onKeyDown(e, terminal.id)}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="terminal-drag-handle" {...attributes} {...listeners} title="Drag to reorder">
            ⋮⋮
          </span>
          <span className="terminal-emoji" onClick={(e) => { e.stopPropagation(); onEmojiClick(terminal.id); }}>
            {terminal.emoji || '⚪'}
          </span>
          <span
            className="terminal-name"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick(terminal);
            }}
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
              onClick={() => onChangeColor(terminal.id, color.name)}
              title={color.name}
            >
              {color.emoji}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          className={`terminal-status status-${connectionStatus}`}
          title={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'loading' ? 'Connecting...' : 'Disconnected'}
        ></span>
        <button
          className="close-terminal"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(terminal.id, e);
          }}
          title={`Close terminal (Ctrl+W)`}
        >
          ×
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  // Only re-render if these specific props change
  return (
    prevProps.terminal.id === nextProps.terminal.id &&
    prevProps.terminal.name === nextProps.terminal.name &&
    prevProps.terminal.color === nextProps.terminal.color &&
    prevProps.terminal.emoji === nextProps.terminal.emoji &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.editingId === nextProps.editingId &&
    prevProps.colorPickerId === nextProps.colorPickerId &&
    prevProps.connectionStatus === nextProps.connectionStatus
  );
});

SortableTerminalItem.displayName = 'SortableTerminalItem';

function SortableTerminalList({
  groups,
  terminals,
  activeTerminal,
  editingId,
  editingName,
  colorPickerId,
  searchQuery,
  setActiveTerminal,
  setEditingId,
  setEditingName,
  setColorPickerId,
  saveEdit,
  cancelEdit,
  handleEditKeyPress,
  removeTerminal,
  changeTerminalColor,
  setTerminals,
  toggleGroupExpand,
  removeGroup,
  moveTerminalToGroup,
  onContextMenu,
  terminalStatuses
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTerminals = terminals.filter(terminal =>
    terminal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = terminals.findIndex((t) => t.id === active.id);
      const newIndex = terminals.findIndex((t) => t.id === over.id);

      setTerminals(arrayMove(terminals, oldIndex, newIndex));
    }
  };

  return (
    <div className="terminal-list">
      {groups.map((group) => {
        const groupTerminals = filteredTerminals.filter(t => t.groupId === group.id);

        if (searchQuery && groupTerminals.length === 0) {
          return null;
        }

        return (
          <div key={group.id} className="terminal-group">
            <div className="group-header" onClick={() => toggleGroupExpand(group.id)}>
              <span className="group-expand">
                {group.expanded ? '▼' : '▶'}
              </span>
              <span className="group-name">{group.name}</span>
              <span className="group-count">({groupTerminals.length})</span>
              {groups.length > 1 && (
                <button
                  className="group-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGroup(group.id);
                  }}
                  title="Remove group"
                >
                  ×
                </button>
              )}
            </div>
            {group.expanded && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={groupTerminals.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {groupTerminals.map((terminal) => (
                    <SortableTerminalItem
                      key={terminal.id}
                      id={terminal.id}
                      terminal={terminal}
                      isActive={activeTerminal === terminal.id}
                      editingId={editingId}
                      editingName={editingName}
                      colorPickerId={colorPickerId}
                      onActivate={() => setActiveTerminal(terminal.id)}
                      onDoubleClick={(terminal) => {
                        setEditingId(terminal.id);
                        setEditingName(terminal.name);
                      }}
                      onEmojiClick={setColorPickerId}
                      onRemove={removeTerminal}
                      onSaveEdit={(id) => saveEdit(id)}
                      onChangeName={setEditingName}
                      onKeyDown={(e, id) => handleEditKeyPress(e, id)}
                      onChangeColor={changeTerminalColor}
                      onContextMenu={onContextMenu}
                      connectionStatus={terminalStatuses[terminal.id] || 'loading'}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      })}
      {filteredTerminals.length === 0 && searchQuery && (
        <div className="no-results">
          No terminals found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

export default SortableTerminalList;
