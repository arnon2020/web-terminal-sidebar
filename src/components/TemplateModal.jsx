import React, { useState, useEffect } from 'react';

function TemplateModal({ isOpen, onClose, onSave, editingTemplate }) {
  const [name, setName] = useState(editingTemplate?.name || '');
  const [command, setCommand] = useState(editingTemplate?.command || '');
  const [description, setDescription] = useState(editingTemplate?.description || '');

  // Update form when editingTemplate changes
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name || '');
      setCommand(editingTemplate.command || '');
      setDescription(editingTemplate.description || '');
    } else {
      setName('');
      setCommand('');
      setDescription('');
    }
  }, [editingTemplate]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedCommand = command.trim();

    if (!trimmedName) {
      alert('Template name cannot be empty');
      return;
    }
    if (!trimmedCommand) {
      alert('Command cannot be empty');
      return;
    }

    onSave({
      name: trimmedName,
      command: trimmedCommand,
      description: description.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="template-form">
            <input
              type="text"
              className="modal-input"
              placeholder="Template name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <textarea
              className="modal-textarea"
              placeholder="Command to execute..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
            />
            <input
              type="text"
              className="modal-input"
              placeholder="Description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="template-variables">
              <small style={{ color: '#666' }}>
                Variables: {'{'}terminal{'}'}, {'{'}name{'}'}, {'{'}date{'}'}
              </small>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleSubmit}
              >
                {editingTemplate ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateModal;
