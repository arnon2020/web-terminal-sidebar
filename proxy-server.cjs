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
  changeOrigin: true, // Change origin to match target
  preserveHeaderKeyCase: true,
  // Preserve all headers
  onProxyReq: (proxyReq, req, res, options) => {
    // Ensure Host header is set to ttyd for WebSocket
    proxyReq.setHeader('Host', `localhost:${TTYD_PORT}`);
    // Ensure Origin header is set correctly for WebSocket
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
      proxyReq.setHeader('Origin', `http://localhost:${TTYD_PORT}`);
      proxyReq.setHeader('Referer', `http://localhost:${TTYD_PORT}/`);
    }
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    // Additional WebSocket-specific headers
    proxyReq.setHeader('Host', `localhost:${TTYD_PORT}`);
    proxyReq.setHeader('Origin', `http://localhost:${TTYD_PORT}`);
    console.log('[WS PROXY REQ HEADERS]', Object.keys(proxyReq.getHeaders()).map(k => `${k}: ${proxyReq.getHeader(k)}`).join(', '));
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

server.listen(PROXY_PORT, '0.0.0.0', () => {
  // Get local IP for network access info
  const { execSync } = require('child_process');
  let localIP = 'localhost';
  try {
    const ip = execSync('ip addr show | grep "inet " | grep -v "127.0.0.1" | awk \'{print $2}\' | cut -d/ -f1 | head -1', { encoding: 'utf-8' }).trim();
    if (ip) localIP = ip;
  } catch (e) {}

  console.log(`========================================`);
  console.log(`  Web Terminal Sidebar Server`);
  console.log(`========================================`);
  console.log(``);
  console.log(`  Local:   http://localhost:${PROXY_PORT}`);
  console.log(`  Network: http://${localIP}:${PROXY_PORT}`);
  console.log(``);
  console.log(`  Vite (internal): http://localhost:${VITE_PORT}`);
  console.log(`  ttyd (internal): http://localhost:${TTYD_PORT}`);
  console.log(`========================================`);
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
