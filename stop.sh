#!/bin/bash
# Web Terminal Sidebar - Stop All Services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Web Terminal Sidebar...${NC}"

# Kill by PID files if exist
if [ -f .ttyd.pid ]; then
    TTYD_PID=$(cat .ttyd.pid)
    kill $TTYD_PID 2>/dev/null && echo -e "${GREEN}✓ Killed ttyd (PID: $TTYD_PID)${NC}"
    rm .ttyd.pid
fi

if [ -f .proxy.pid ]; then
    PROXY_PID=$(cat .proxy.pid)
    kill $PROXY_PID 2>/dev/null && echo -e "${GREEN}✓ Killed proxy (PID: $PROXY_PID)${NC}"
    rm .proxy.pid
fi

# Also kill by port (fallback)
for PORT in 3000 3001 7682; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null && echo -e "${GREEN}✓ Killed process on port $PORT (PID: $PID)${NC}"
    fi
done

# Kill tmux sessions created by ttyd
tmux list-sessions 2>/dev/null | grep 'term_' | awk '{print $1}' | sed 's/://g' | while read session; do
    tmux kill-session -t "$session" 2>/dev/null && echo -e "${GREEN}✓ Killed tmux session: $session${NC}"
done

echo -e "${GREEN}All services stopped!${NC}"
