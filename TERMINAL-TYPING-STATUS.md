# Terminal Typing Bug - Current Status

**Date**: 2026-03-11

## Issue Summary
Terminal clicking works ✓ | Terminal typing ✗ (WebSocket connection fails)

## What's Working
- Terminal clicking: Can switch between terminals (fixed)
- Terminal display: HTML content loads correctly via proxy
- HTTP proxy: `/terminal?id=xxx` → `http://localhost:7682/?id=xxx` works (200 OK)

## What's NOT Working
- Terminal typing: WebSocket connection fails
- Error: `WebSocket connection to 'ws://localhost:3000/?token=xxx' failed: Connection closed before receiving a handshake response`

## Root Cause
The ttyd terminal emulator uses WebSocket for bidirectional communication. When the page loads from `http://localhost:3000/terminal?id=xxx`, the JavaScript inside it tries to connect to `ws://localhost:3000/?token=xxx`.

This WebSocket request needs to be proxied to `ws://localhost:7682/?token=xxx`, but the proxy configuration is not handling this correctly.

## Attempted Solutions
1. ✅ Vite proxy configuration - HTTP works, WebSocket fails
2. ✅ Custom proxy server with http-proxy - HTTP works, WebSocket fails
3. ✅ Direct TCP WebSocket forwarding - Connection closes immediately
4. ✅ Header preservation (Origin, Sec-WebSocket-*) - Still fails
5. ✅ Path rewriting (/terminal → /) - Works for HTTP, not for WebSocket

## Current Configuration
- **Frontend**: Vite on port 3006 (started via proxy-server.cjs)
- **Proxy Server**: Node.js custom proxy on port 3000
- **ttyd**: Running on port 7682
- **Proxy routes**:
  - `/terminal*` → ttyd
  - `/ws*` → ttyd
  - `/token*` → ttyd
  - `/?token=*` → ttyd (WebSocket)
  - Everything else → Vite

## File Changes
- `vite.config.js` - Changed port to 3001 (proxy server handles routing)
- `proxy-server.cjs` - Custom proxy server (created)
- `package.json` - Added `dev:proxy` script
- `src/components/TerminalWrapper.jsx` - Uses `/terminal?id=` path

## Next Steps (Options)
1. **Accept limitation**: Terminal displays output but cannot type
2. **Different approach**: Embed xterm.js directly instead of using ttyd iframe
3. **Run on same port**: Serve frontend from ttyd or use nginx for proper WebSocket proxy
4. **Use nginx**: Configure nginx as reverse proxy (better WebSocket support)

## Testing Notes
Direct WebSocket to ttyd works:
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:7682/?token=TEST
# Returns: HTTP/1.1 101 Switching Protocols ✓
```

The issue is specifically with proxying the WebSocket through Vite/Node.js.
