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

# Set proper TERM for interactive programs
export TERM=xterm-256color

# Create custom shell startup script that unsets CLAUDECODE
SHELL_WRAPPER=$(mktemp)
cat > "$SHELL_WRAPPER" << 'INNER'
#!/bin/bash
# Load normal bashrc first
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi
# Then unset CLAUDECODE for nested sessions
unset CLAUDECODE 2>/dev/null
unset CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC 2>/dev/null
unset CLAUDE_CODE_ENTRYPOINT 2>/dev/null
# Exec interactive bash
exec bash -i
INNER

chmod +x "$SHELL_WRAPPER"

# Sanitize session name
SESSION_NAME="term_$(echo "$TERM_ID" | sed 's/[^a-zA-Z0-9_]/_/g' | cut -c1-50)"

# Check if session exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo ">>> Reconnecting to: $SESSION_NAME"
    echo ">>> CLAUDECODE: unset (nested sessions allowed)"
    echo ""
else
    echo ">>> Creating new session: $SESSION_NAME"
    echo ">>> CLAUDECODE: unset (nested sessions allowed)"
    echo ""
fi

# Attach to or create session using our wrapper shell
exec tmux new -A -s "$SESSION_NAME" "$SHELL_WRAPPER"
WRAPPER

chmod +x "$WRAPPER_SCRIPT"

# Remove the marker we added for testing
sed -i '/BASHRC_TTYD_OVERRIDE LOADED/d' /home/user/.bashrc_ttyd_override 2>/dev/null

chmod +x "$WRAPPER_SCRIPT"

# Start ttyd with --url-arg AND true TTY mode for interactive programs
# -t enables true TTY mode (required for Claude, vim, htop, etc.)
# -W preserves UTF-8 and wide characters
# The argument from URL (?arg=XXX) is passed to the wrapper script
ttyd -p "$PORT" -t -W --url-arg "$WRAPPER_SCRIPT"
