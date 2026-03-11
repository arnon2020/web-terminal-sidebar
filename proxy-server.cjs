const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');

const PROXY_PORT = 3000;
const VITE_PORT = 3001;
const TTYD_PORT = 7682;

// Create proxy for ttyd
const ttydProxy = httpProxy.createProxyServer({
  target: `http://localhost:${TTYD_PORT}`,
  ws: true,
  changeOrigin: false, // Don't change origin for WebSocket
  preserveHeaderKeyCase: true,
  // Preserve all headers
  onProxyReq: (proxyReq, req, res, options) => {
    // Ensure Origin header is set correctly for WebSocket
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
      proxyReq.setHeader('Origin', `http://localhost:${TTYD_PORT}`);
    }
  }
});

// Add error handler for ttyd proxy
ttydProxy.on('error', (err, req, res) => {
  console.error('[TTYD PROXY ERROR]', err.message);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  }
});

ttydProxy.on('proxyReq', (proxyReq, req, res, options) => {
  console.log('[TTYD PROXY]', req.method, req.url, '->', `http://localhost:${TTYD_PORT}${req.url}`);
});

ttydProxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
  console.log('[TTYD WS PROXY]', req.url, '->', `http://localhost:${TTYD_PORT}${req.url}`);
  // Ensure WebSocket headers are preserved
  if (req.headers['sec-websocket-protocol']) {
    proxyReq.setHeader('Sec-WebSocket-Protocol', req.headers['sec-websocket-protocol']);
  }
  if (req.headers['sec-websocket-extensions']) {
    proxyReq.setHeader('Sec-WebSocket-Extensions', req.headers['sec-websocket-extensions']);
  }
});

ttydProxy.on('proxyRes', (proxyRes, req, res) => {
  console.log('[TTYD PROXY RES]', req.url, proxyRes.statusCode);
});

ttydProxy.on('upgrade', (req, socket, head) => {
  console.log('[TTYD UPGRADE]', req.url);
});

// Create proxy for Vite
const viteProxy = httpProxy.createProxyServer({
  target: `http://localhost:${VITE_PORT}`,
  ws: true,
  changeOrigin: true
});

// Add error handler for Vite proxy
viteProxy.on('error', (err, req, res) => {
  console.error('[VITE PROXY ERROR]', err.message);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  }
});

// Start Vite on different port
const vite = spawn('bun', ['run', 'dev', '--port', VITE_PORT.toString()], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

vite.on('error', (err) => {
  console.error('[VITE ERROR]', err);
});

vite.on('exit', (code) => {
  console.log(`[VITE] exited with code ${code}`);
  process.exit(code);
});

// Create main server
const server = http.createServer((req, res) => {
  const url = req.url;

  // Proxy /terminal* and related paths to ttyd
  if (url.startsWith('/terminal') || url.startsWith('/ws') || url.startsWith('/token')) {
    // Rewrite path: /terminal?id=123 -> /?id=123
    if (url.startsWith('/terminal')) {
      const newPath = url.replace(/^\/terminal/, '') || '/';
      req.url = newPath;
    }
    // /terminal/ws -> /ws
    else if (url.startsWith('/terminal/ws')) {
      req.url = url.replace(/^\/terminal\/ws/, '/ws');
    }
    // /terminal/token -> /token
    else if (url.startsWith('/terminal/token')) {
      req.url = url.replace(/^\/terminal\/token/, '/token');
    }

    ttydProxy.web(req, res, { target: `http://localhost:${TTYD_PORT}` });
  }
  // Proxy everything else to Vite
  else {
    viteProxy.web(req, res);
  }
});

// Handle WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Check if this is a ttyd WebSocket request
  // ttyd uses paths like: /ws, /terminal/ws, or has token parameter
  const isTtydRequest =
    pathname === '/ws' ||
    pathname === '/terminal/ws' ||
    pathname.startsWith('/terminal/ws') ||
    url.searchParams.has('token');

  if (isTtydRequest) {
    // Rewrite path for WebSocket: /terminal/ws -> /ws
    let wsPath = req.url;
    if (pathname === '/terminal/ws' || pathname.startsWith('/terminal/ws')) {
      wsPath = req.url.replace(/^\/terminal\/ws/, '/ws') || '/ws';
      req.url = wsPath;
    }

    console.log('[WS UPGRADE]', wsPath, '-> ttyd');

    // Add error handling for the socket
    socket.on('error', (err) => {
      console.error('[WS SOCKET ERROR]', err.message);
    });

    // Use http-proxy for WebSocket (it handles the handshake properly)
    ttydProxy.ws(req, socket, head, (err) => {
      if (err) {
        console.error('[WS TTYD PROXY ERROR]', err.message);
        socket.end();
      } else {
        console.log('[WS TTYD PROXY SUCCESS]');
      }
    });
  }
  // Otherwise proxy to Vite (for Vite's HMR WebSocket)
  else if (url.pathname.startsWith('/__vite_hmr')) {
    console.log('[WS UPGRADE]', req.url, '-> Vite HMR');

    socket.on('error', (err) => {
      console.error('[WS SOCKET ERROR]', err.message);
    });

    viteProxy.ws(req, socket, head, (err) => {
      if (err) {
        console.error('[WS PROXY ERROR]', err.message);
        socket.end();
      }
    });
  }
  // Unknown WebSocket request - close it
  else {
    console.log('[WS UPGRADE] Unknown path, closing:', req.url);
    socket.end();
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`Proxy server running on http://localhost:${PROXY_PORT}`);
  console.log(`  Vite: http://localhost:${VITE_PORT} (proxied)`);
  console.log(`  ttyd: http://localhost:${TTYD_PORT} (proxied)`);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('[PROXY] Shutting down...');
  vite.kill();
  server.close();
});

process.on('SIGINT', () => {
  console.log('[PROXY] Shutting down...');
  vite.kill();
  server.close();
  process.exit(0);
});
