#!/bin/bash
# Start ttyd with tmux for persistent terminal sessions
# Each terminal gets its own tmux session that survives page reloads
#
# Usage: ./start-ttyd-tmux.sh [port]
# Default port: 7682
#
# How it works:
# 1. Frontend sends: http://localhost:7682?arg=123
# 2. ttyd with --url-arg passes "123" as argument to the wrapper script
# 3. Wrapper creates/attaches to tmux session "term_123"
# 4. On page reload, same session is reconnected

PORT=${1:-7682}

echo "============================================"
echo "  ttyd + tmux Persistent Terminal Server"
echo "============================================"
echo ""
echo "Port: $PORT"
echo "Sessions persist across page reloads!"
echo ""

# Check if ttyd is installed
if ! command -v ttyd &> /dev/null; then
    echo "ERROR: ttyd is not installed"
    echo "Install with: sudo apt install ttyd"
    exit 1
fi

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "ERROR: tmux is not installed"
    echo "Install with: sudo apt install tmux"
    exit 1
fi

# Kill any existing ttyd on this port
echo "Checking for existing ttyd process on port $PORT..."
lsof -ti:$PORT | xargs -r kill -9 2>/dev/null
sleep 1

echo "Starting ttyd..."
echo ""
echo "Connect with URL: http://localhost:$PORT?arg=<id>"
echo "Example: http://localhost:$PORT?arg=1"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Create wrapper script that handles tmux session
WRAPPER_SCRIPT=$(mktemp)
cat > "$WRAPPER_SCRIPT" << 'WRAPPER'
#!/bin/bash
# Get terminal ID from first argument (passed by ttyd --url-arg)
TERM_ID="${1:-main}"

# Sanitize session name (only allow alphanumeric and underscore)
SESSION_NAME="term_$(echo "$TERM_ID" | sed 's/[^a-zA-Z0-9_]/_/g' | cut -c1-50)"

# Check if session exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo ">>> Reconnecting to: $SESSION_NAME"
    echo ">>> Your previous terminal content is preserved!"
    echo ""
else
    echo ">>> Creating new session: $SESSION_NAME"
    echo ">>> Content will survive page reloads."
    echo ""
fi

# Attach to or create session (-A: create if doesn't exist)
exec tmux new -A -s "$SESSION_NAME"
WRAPPER

chmod +x "$WRAPPER_SCRIPT"

# Start ttyd with --url-arg
# The argument from URL (?arg=XXX) is passed to the wrapper script
ttyd -p "$PORT" -W --url-arg "$WRAPPER_SCRIPT"
