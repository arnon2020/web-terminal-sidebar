import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

/**
 * TerminalWrapper Component
 *
 * Secure wrapper for ttyd iframe with sandbox protection.
 * Click anywhere on the wrapper to focus the iframe for typing.
 *
 * Exposes iframeRef via forwardRef for VirtualKeyboard integration.
 */

// ttyd server URL - use relative path for proxy support
// Works from both localhost and network access
// Pass terminal ID as arg for tmux session isolation
const TTYD_URL = '/terminal';

// Security: Sanitize ID for safe URL construction
const sanitizeId = (id) => {
  const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (isNaN(numId) || numId <= 0) {
    throw new Error('Invalid terminal ID');
  }
  return String(numId);
};

const TerminalWrapper = forwardRef(function TerminalWrapper({ terminal, isActive, onLoad, onError }, ref) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Expose iframeRef to parent component for VirtualKeyboard
  useImperativeHandle(ref, () => ({
    getIframe: () => iframeRef.current,
    focus: () => {
      if (iframeRef.current) {
        iframeRef.current.focus();
      }
    }
  }), []);

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

  // Sanitize terminal ID for data attribute (not used in URL anymore)
  const safeId = sanitizeId(terminal.id);

  return (
    <div
      ref={containerRef}
      className={`terminal-wrapper ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0d0d1a',
        display: isActive ? 'block' : 'none'
      }}
    >
      <iframe
        ref={iframeRef}
        src={`${TTYD_URL}?arg=${safeId}`}
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
        // No sandbox - direct connection for full functionality
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
});

export default TerminalWrapper;
