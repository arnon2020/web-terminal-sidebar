#!/bin/bash
# Web Terminal Sidebar - Start All Services
# Usage: ./start.sh [proxy_port]

PROXY_PORT=${1:-3000}
VITE_PORT=3001
TTYD_PORT=7682

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "  Web Terminal Sidebar - Start All"
echo -e "========================================${NC}"
echo ""

# Get local IP
LOCAL_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -1)

# Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

if ! command -v ttyd &> /dev/null; then
    echo -e "${RED}ERROR: ttyd is not installed${NC}"
    echo "Install with: sudo apt install ttyd"
    exit 1
fi

if ! command -v tmux &> /dev/null; then
    echo -e "${RED}ERROR: tmux is not installed${NC}"
    echo "Install with: sudo apt install tmux"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo -e "${RED}ERROR: bun is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All dependencies found${NC}"
echo ""

# Stop any existing processes
echo -e "${YELLOW}Stopping existing processes...${NC}"
lsof -ti:$PROXY_PORT | xargs -r kill -9 2>/dev/null
lsof -ti:$VITE_PORT | xargs -r kill -9 2>/dev/null
lsof -ti:$TTYD_PORT | xargs -r kill -9 2>/dev/null
sleep 1
echo -e "${GREEN}✓ Ports cleared${NC}"
echo ""

# Start ttyd
echo -e "${YELLOW}Starting ttyd (terminal backend)...${NC}"
./start-ttyd-tmux.sh $TTYD_PORT > /dev/null 2>&1 &
TTYD_PID=$!
sleep 2

if lsof -ti:$TTYD_PORT > /dev/null; then
    echo -e "${GREEN}✓ ttyd started on port $TTYD_PORT${NC}"
else
    echo -e "${RED}✗ ttyd failed to start${NC}"
    exit 1
fi
echo ""

# Start proxy server (includes Vite)
echo -e "${YELLOW}Starting proxy server (includes Vite frontend)...${NC}"
node proxy-server.cjs &
PROXY_PID=$!
sleep 2

if lsof -ti:$PROXY_PORT > /dev/null; then
    echo -e "${GREEN}✓ Proxy server started${NC}"
else
    echo -e "${RED}✗ Proxy server failed to start${NC}"
    exit 1
fi
echo ""

# Success message
echo -e "${GREEN}========================================"
echo "  All services started successfully!"
echo -e "========================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Local:   ${GREEN}http://localhost:$PROXY_PORT${NC}"
if [ -n "$LOCAL_IP" ]; then
    echo -e "  Network: ${GREEN}http://$LOCAL_IP:$PROXY_PORT${NC}"
fi
echo ""
echo -e "${YELLOW}Services:${NC}"
echo "  • Frontend (Vite): port $VITE_PORT (proxied)"
echo "  • Terminal (ttyd): port $TTYD_PORT (proxied)"
echo ""
echo -e "${YELLOW}Claude Code:${NC}"
if command -v claude &> /dev/null; then
    CLAUDE_PATH=$(which claude)
    echo "  • Available at: $CLAUDE_PATH"
    echo "  • Just type ${GREEN}claude${NC} in the terminal!"
else
    echo -e "  ${RED}Not found in PATH${NC}"
    echo "  Install with: npm install -g @anthropic-ai/claude-code"
fi
echo ""
echo -e "${YELLOW}Stop all services:${NC}"
echo "  kill $TTYD_PID $PROXY_PID"
echo "  Or run: ./stop.sh"
echo ""

# Save PIDs for stop script
echo "$TTYD_PID" > .ttyd.pid
echo "$PROXY_PID" > .proxy.pid

echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for processes
wait $PROXY_PID $TTYD_PID
