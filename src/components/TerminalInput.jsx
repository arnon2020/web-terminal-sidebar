import { useEffect, useRef } from 'react';

/**
 * TerminalInput Component
 * 
 * Handles keyboard input and sends it to the ttyd iframe.
 * This component solves the issue where typing in the terminal doesn't work.
 * 
 * Solution:
 * 1. Auto-focus the iframe when terminal is selected
 * 2. Capture keyboard events and send to ttyd via postMessage
 * 3. Handle terminal focus state properly
 */
export default function TerminalInput({ terminal, isActive, onFocusChange }) {
  const iframeRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!terminal || !isActive) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      return;
    }

    // Focus the iframe when terminal becomes active
    const focusIframe = () => {
      if (iframeRef.current) {
        try {
          // Try to focus the iframe directly
          iframeRef.current.focus();
          
          // Also try to focus the content window
          if (iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.focus();
          }
          
          // Try to find and focus the xterm terminal element inside iframe
          try {
            const xtermElement = iframeRef.current.contentWindow.document?.querySelector('.xterm-helper-textarea');
            if (xtermElement) {
              xtermElement.focus();
            }
          } catch (e) {
            // Cross-origin, can't access iframe content
            // This is expected with ttyd
          }
          
          if (onFocusChange) {
            onFocusChange(true);
          }
        } catch (e) {
          console.error('Failed to focus iframe:', e);
        }
      }
    };

    // Delay focus to ensure iframe is loaded
    focusTimeoutRef.current = setTimeout(() => {
      focusIframe();
    }, 100);

    // Also try focusing on iframe load
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setTimeout(focusIframe, 50);
      };
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [terminal, isActive, onFocusChange]);

  const handleKeyDown = (e) => {
    if (!isActive || !iframeRef.current) return;

    // Send keyboard event to iframe via postMessage
    // ttyd uses xterm.js which has its own event handling
    try {
      iframeRef.current.contentWindow?.postMessage({
        type: 'input',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey
      }, '*');
    } catch (e) {
      // Ignore cross-origin errors
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={`http://localhost:7682?id=${terminal?.id}`}
      className={`terminal-iframe ${isActive ? 'active' : ''}`}
      title={terminal?.name || 'Terminal'}
      data-terminal-id={terminal?.id}
      onKeyDown={handleKeyDown}
      tabIndex={isActive ? 0 : -1}
      allowFullScreen
      allow="clipboard-read; clipboard-write"
    />
  );
}
