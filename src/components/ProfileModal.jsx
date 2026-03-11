import React, { useState, useEffect } from 'react';

function ProfileModal({ isOpen, onClose, onSave, editingProfile, existingProfiles }) {
  const [name, setName] = useState(editingProfile?.name || '');
  const [shell, setShell] = useState(editingProfile?.shell || '/bin/bash');
  const [workingDir, setWorkingDir] = useState(editingProfile?.workingDir || '~');
  const [envVars, setEnvVars] = useState(editingProfile?.envVars || '');
  const [startupCmd, setStartupCmd] = useState(editingProfile?.startupCmd || '');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert('Profile name cannot be empty');
      return;
    }

    // Parse env vars (format: KEY=value, one per line)
    const envVarsArray = envVars
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('='))
      .map(line => {
        const [key, ...valueParts] = line.split('=');
        return { key, value: valueParts.join('=') };
      });

    onSave({
      name: trimmedName,
      shell,
      workingDir,
      envVars: envVarsArray,
      startupCmd: startupCmd.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProfile ? 'Edit Profile' : 'New Terminal Profile'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="profile-form">
            <div className="form-group">
              <label>Profile Name</label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g., Development, Database, Logs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Shell</label>
              <select
                className="modal-input"
                value={shell}
                onChange={(e) => setShell(e.target.value)}
              >
                <option value="/bin/bash">Bash (/bin/bash)</option>
                <option value="/bin/zsh">Zsh (/bin/zsh)</option>
                <option value="/bin/fish">Fish (/bin/fish)</option>
                <option value="/bin/sh">Sh (/bin/sh)</option>
                <option value="/usr/bin/tmux">Tmux (/usr/bin/tmux)</option>
                <option value="/usr/bin/screen">Screen (/usr/bin/screen)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Working Directory</label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g., ~/projects, /var/log"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Environment Variables (one per line: KEY=value)</label>
              <textarea
                className="modal-textarea"
                placeholder="NODE_ENV=development\nPORT=3000"
                value={envVars}
                onChange={(e) => setEnvVars(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Startup Command (optional)</label>
              <input
                type="text"
                className="modal-input"
                placeholder="Command to run on terminal start"
                value={startupCmd}
                onChange={(e) => setStartupCmd(e.target.value)}
              />
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
                {editingProfile ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
