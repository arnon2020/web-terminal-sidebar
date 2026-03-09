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
- **Docker** (for ttyd backend)
- **tmux** (optional, pre-installed in Docker image)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/arnon2020/web-terminal-sidebar.git
cd web-terminal-sidebar
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Start ttyd backend (Docker)

```bash
docker run -d -p 7681:7681 tsl0922/ttyd
```

Or with tmux pre-installed:

```bash
docker build -t ttyd-tmux ~/ttyd-tmux
docker run -d -p 7681:7681 ttyd-tmux
```

### 4. Start the development server

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
| Frontend | React 18.2.0 |
| Build Tool | Vite 5.2.0 |
| Terminal Backend | ttyd |
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
docker ps | grep ttyd
```

If not running, start it:
```bash
docker run -d -p 7681:7681 tsl0922/ttyd
```

### Port 7681 already in use

Stop the existing container:
```bash
docker stop $(docker ps -q -f publish=7681)
```

Or use a different port (update `TTYD_URL` in `src/App.jsx`):
```bash
docker run -d -p 7682:7681 tsl0922/ttyd
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Author

Created by [arnon2020](https://github.com/arnon2020)

---

**Made with ❤️ for developers who need multiple terminals**
