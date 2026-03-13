#!/bin/bash
# Tmux wrapper for ttyd --url-arg
# This script is called by ttyd with the terminal ID as first argument
# Usage: ttyd --url-arg ./tmux-wrapper.sh

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
