import { useEffect, useRef, useState } from 'react';

/**
 * TerminalWrapper Component
 *
 * Secure wrapper for ttyd iframe with sandbox protection.
 * Click anywhere on the wrapper to focus the iframe for typing.
 */

// ttyd server URL
const TTYD_URL = 'http://localhost:7682';

// Security: Sanitize ID for safe URL construction
const sanitizeId = (id) => {
  const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (isNaN(numId) || numId <= 0) {
    throw new Error('Invalid terminal ID');
  }
  return String(numId);
};

export default function TerminalWrapper({ terminal, isActive, onLoad, onError }) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const handleIframeLoad = () => {
    if (onLoad) onLoad(terminal.id);
  };

  const handleIframeError = () => {
    if (onError) onError(terminal.id);
  };

  // When clicking the container, focus the iframe
  const handleClick = () => {
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  };

  // Sanitize terminal ID for safe URL construction
  const safeId = sanitizeId(terminal.id);

  return (
    <div
      ref={containerRef}
      className="terminal-wrapper"
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0d0d1a'
      }}
    >
      <iframe
        ref={iframeRef}
        src={`${TTYD_URL}?id=${safeId}`}
        className={`terminal-iframe ${isActive ? 'active' : ''}`}
        title={terminal.name}
        data-terminal-id={safeId}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: '#0d0d1a'
        }}
        // Security: Sandbox attribute restricts iframe capabilities
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        referrerPolicy="no-referrer"
        allowFullScreen
        allow="clipboard-read; clipboard-write; keyboard-input"
        tabIndex={isActive ? 0 : -1}
      />

      <style>{`
        .terminal-wrapper {
          position: relative;
        }

        .terminal-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .terminal-iframe:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
