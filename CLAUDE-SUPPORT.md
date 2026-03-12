# Claude Code Support in Web Terminal Sidebar

## Overview

Web Terminal Sidebar now supports **full interactive TTY mode** for Claude Code CLI and other interactive programs (vim, htop, etc.)

## What Was Changed

### 1. ttyd True TTY Mode (`start-ttyd-tmux.sh`)

**Before:**
```bash
ttyd -p "$PORT" -W --url-arg "$WRAPPER_SCRIPT"
```

**After:**
```bash
ttyd -p "$PORT" -t -W --url-arg "$WRAPPER_SCRIPT"
#          ^^^
#          Added -t flag for true TTY mode
```

### 2. Terminal Type in Wrapper Script

**Added to wrapper script:**
```bash
export TERM=xterm-256color
```

This ensures proper:
- 256-color support for syntax highlighting
- Cursor movement keys
- Function keys
- International character support

## How to Use

### Start the Server

```bash
cd /home/user/web-terminal-sidebar
./start.sh
```

### Access the Terminal

1. Open http://localhost:3000 in your browser
2. Click **+** to add a new terminal
3. Name it (e.g., "claude-main")
4. Type `claude` and press Enter

### Verify TTY Support

```bash
# In the web terminal, run:
tty
# Should output: /dev/pts/X

echo $TERM
# Should output: xterm-256color

# Test interactive program
vim --version
# Should work without any terminal errors
```

## Troubleshooting

### Claude doesn't respond to input

**Problem:** Missing TTY mode
**Solution:** Make sure ttyd is started with `-t` flag

Check running process:
```bash
ps aux | grep ttyd
```

Should show:
```
ttyd -p 7682 -t -W --url-arg /tmp/...
```

### Colors look wrong

**Problem:** TERM not set correctly
**Solution:** Check wrapper script has `export TERM=xterm-256color`

Test in terminal:
```bash
echo $TERM
```

Should output: `xterm-256color`

### Session doesn't persist

**Problem:** tmux session not being created
**Solution:** Check tmux is installed and working

```bash
tmux -V
# Should show version 3.0+

tmux list-sessions
# Should show your terminal sessions
```

## Technical Details

### Architecture

```
Browser (WebSocket)
    ↓
Proxy Server (port 3000)
    ↓
ttyd (port 7682) with -t flag ← KEY: True TTY mode
    ↓
tmux session (persistent)
    ↓
bash with TERM=xterm-256color
    ↓
claude CLI (interactive)
```

### Why `-t` Flag Matters

The `-t` flag tells ttyd to allocate a **pseudo-terminal (PTY)** instead of just piping stdin/stdout. This is critical for:

1. **Terminal size detection** - Programs like vim need to know screen dimensions
2. **Raw input mode** - Claude needs direct keyboard input
3. **Signal handling** - Ctrl+C, Ctrl+D work correctly
4. **Terminal capabilities** - Colors, cursor positioning, etc.

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `TERM` | `xterm-256color` | Terminal capabilities |
| `LANG` | `en_US.UTF-8` | Character encoding |
| `LC_ALL` | `en_US.UTF-8` | Locale settings |

## Testing Your Setup

Run this test script in the web terminal:

```bash
#!/bin/bash
echo "=== Web Terminal TTY Test ==="
echo ""
echo "1. TTY Check:"
tty && echo "  ✅ TTY available" || echo "  ❌ No TTY"
echo ""
echo "2. TERM Check:"
[ "$TERM" = "xterm-256color" ] && echo "  ✅ TERM is xterm-256color" || echo "  ⚠️  TERM is $TERM"
echo ""
echo "3. Locale Check:"
locale | grep UTF-8 > /dev/null && echo "  ✅ UTF-8 locale" || echo "  ❌ UTF-8 not set"
echo ""
echo "4. Interactive Program Test:"
echo "   Try running: vim --version"
echo "   Should work without errors"
echo ""
echo "5. Claude CLI Test:"
if command -v claude &> /dev/null; then
    echo "  ✅ claude found at: $(which claude)"
    echo "   Run: claude"
else
    echo "  ⚠️  claude not found"
    echo "   Install: npm install -g @anthropic-ai/claude-code"
fi
```

## Future Enhancements

Potential improvements:
- [ ] Auto-detect and display TTY status in UI
- [ ] Quick-launch buttons for common tools (claude, vim, etc.)
- [ ] Terminal profiles for different use cases
- [ ] Integration with Claude Code skills system

## Resources

- [ttyd GitHub](https://github.com/tsl0922/ttyd)
- [tmux Manual](https://github.com/tmux/tmux/wiki)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code/overview)
