# Web Terminal Sidebar

Web-based multi-terminal interface with sidebar management for easy access to multiple terminal sessions.

![Terminal Interface](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.2.0-646CFF)
![ttyd](https://img.shields.io/badge/ttyd-Compatible-orange)

## Features

- 🖥️ **Multiple Terminals** - Run multiple terminal sessions simultaneously
- 📝 **Custom Names** - Double-click to rename terminals for easy identification
- 🔄 **Session Persistence** - Switch between terminals without losing context
- 📂 **Sidebar Navigation** - Horizontal layout with icons on left, terminal list on right
- ⚡ **Fast & Lightweight** - Built with React and Vite for instant loading
- 🎨 **Dark Theme** - Easy on the eyes during long coding sessions

## Preview

```
┌────────────────────────────────────────────────────┐
│ Sidebar (300px)        │ Main Content Area         │
│ ┌────────┬────────────┐│                            │
│ │  🖥️   │ backend    ││                            │
│ │        ├────────────┤│   [Terminal Display]      │
│ │  +    │ frontend   ││                            │
│ │        ├────────────┤│                            │
│ │  Icon │ database   ││                            │
│ │        └────────────┘│                            │
└────────────────────────────────────────────────────┘
```

## Requirements

- **Node.js** 18+ and npm
- **ttyd** terminal backend (see installation options below)
- **tmux** (optional, for multiple windows within a terminal)

## Installation

### Step 1: Clone the repository

```bash
git clone https://github.com/arnon2020/web-terminal-sidebar.git
cd web-terminal-sidebar
```

### Step 2: Install frontend dependencies

```bash
npm install
```

### Step 3: Install ttyd backend

Choose **one** of the following methods:

#### Option A: Pre-built Binary (Recommended - Easiest)

```bash
# Download latest release
wget https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd_linux.x86_64
sudo mv ttyd_linux.x86_64 /usr/local/bin/ttyd
sudo chmod +x /usr/local/bin/ttyd

# Run ttyd
ttyd bash
```

#### Option B: Build from Source

```bash
# Install build dependencies
sudo apt install build-essential libjson-c-dev libwebsockets-dev

# Clone and build
git clone https://github.com/tsl0922/ttyd.git
cd ttyd
mkdir build && cd build
cmake ..
make && sudo make install

# Run ttyd
ttyd bash
```

#### Option C: Docker

```bash
docker run -d -p 7681:7681 tsl0922/ttyd
```

#### Option D: Snap (Ubuntu/Debian)

```bash
sudo snap install ttyd
ttyd bash
```

**Default URL:** http://localhost:7681

If you use a different port or URL, update `TTYD_URL` in `src/App.jsx`.

### Step 4: Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Adding Terminals

1. Click the **+** button in the sidebar
2. Enter a name for your terminal (e.g., `backend`, `frontend`, `database`)
3. A new terminal session will be created

### Switching Between Terminals

Click on any terminal name in the sidebar to switch to it. Your session context is preserved!

### Renaming Terminals

1. **Double-click** on the terminal name in the sidebar
2. Type the new name
3. Press **Enter** to save or **Escape** to cancel

### Closing Terminals

Hover over a terminal and click the **×** button to close it.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend Framework | React 18.2.0 |
| Build Tool | Vite 5.2.0 |
| Terminal Backend | ttyd (C-based web terminal) |
| Terminal Emulator | xterm.js (via ttyd) |
| Styling | CSS3 (Flexbox) |

## Directory Structure

```
web-terminal-sidebar/
├── src/
│   ├── App.jsx          # Main React component
│   ├── main.jsx         # React entry point
│   └── index.css        # Additional styles
├── index.html           # HTML + CSS styles
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## Common Use Cases

### Running Multiple Services

```
┌─────────────────────────────────────┐
│ backend    │ npm run dev            │
│ frontend   │ npm run dev            │
│ database   │ psql -d mydb           │
│ logs       │ tail -f /var/log/app.log│
└─────────────────────────────────────┘
```

### Managing Projects

```
┌─────────────────────────────────────┐
│ server      │ SSH to production     │
│ local-dev   │ Local development     │
│ staging     │ Staging environment   │
│ tests       │ Run test suite        │
└─────────────────────────────────────┘
```

## Tips

- 🏷️ **Use descriptive names** - Instead of "Terminal 1", use "API Server" or "PostgreSQL"
- 💡 **Keep related work together** - Group terminals by project or task
- 🔧 **Use tmux inside** - For even more windows, use tmux inside any terminal
- ⌨️ **Keyboard shortcuts** - Use Enter to save name, Escape to cancel editing

## Troubleshooting

### Terminal shows blank screen

Make sure ttyd is running:
```bash
# Check if ttyd is running
ps aux | grep ttyd
# OR if using Docker
docker ps | grep ttyd
```

If not running, start it:
```bash
# Binary/Source installation
ttyd bash

# Docker
docker run -d -p 7681:7681 tsl0922/ttyd
```

### Port 7681 already in use

Stop the existing process:
```bash
# Find and kill the process
lsof -ti:7681 | xargs kill -9

# OR if using Docker
docker stop $(docker ps -q -f publish=7681)
```

Then restart ttyd.

### Can't connect to ttyd

1. Check if ttyd is accessible: http://localhost:7681
2. Check browser console for errors
3. Verify `TTYD_URL` in `src/App.jsx` matches your ttyd address

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Author

Created by [arnon2020](https://github.com/arnon2020)

---

**Made with ❤️ for developers who need multiple terminals**
