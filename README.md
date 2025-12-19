# Experience Remote

A web-based remote control for media servers. Control your desktop cursor, trigger media actions, and send OSC commands from your phone.

## Architecture

```
Phone (Web Remote) ←→ WebRTC P2P ←→ Desktop App ←→ Chataigne (OSC)
                            ↑
                    Signaling Server
```

## Components

- **web-remote** - React app for phone (trackpad, gyroscope, keyboard, controls)
- **signaling-server** - Node.js WebRTC signaling server
- **desktop** - Electron app (QR code display, mouse/keyboard control, OSC sender)
- **shared** - Shared TypeScript types

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev
```

Or start individually:

```bash
# Signaling server (port 3001)
pnpm dev:server

# Web remote (port 5173)
pnpm dev:web

# Desktop app
pnpm dev:desktop
```

## Usage

1. **Launch the desktop app** - A QR code will appear
2. **Scan the QR code** with your phone camera
3. **Use the remote** to control your desktop:
   - Trackpad gestures → Mouse movement
   - Tap → Left click
   - Two-finger tap → Right click
   - Two-finger drag → Scroll
   - Side arrows → Keyboard navigation
   - Top bar → Media controls & OSC triggers

## Chataigne Integration

The desktop app sends OSC messages to Chataigne on port 9000 (configurable).

### OSC Messages

| Address | Description |
|---------|-------------|
| `/remote/media/play_pause` | Toggle playback |
| `/remote/media/next` | Next clip/scene |
| `/remote/media/prev` | Previous clip/scene |
| `/remote/osc/1` | Custom trigger 1 |
| `/remote/osc/2` | Custom trigger 2 |
| `/remote/osc/3` | Custom trigger 3 |

### Chataigne Setup

1. Add an **OSC module** in Chataigne
2. Set it to listen on port **9000**
3. Create mappings from OSC addresses to your desired actions

## Building for Production

### Web Remote

```bash
pnpm build:web
# Output: apps/web-remote/dist
```

### Signaling Server

```bash
pnpm build:server
# Deploy to Railway, Render, or your own server
```

### Desktop App

```bash
cd apps/desktop
pnpm package
# Output: apps/desktop/release
```

## Configuration

### Environment Variables

**Signaling Server:**
- `PORT` - Server port (default: 3001)

**Desktop App:**
- `SIGNALING_URL` - Signaling server URL (default: http://localhost:3001)
- `WEB_REMOTE_URL` - Web remote URL (default: http://localhost:5173)

## Project Structure

```
experience-remote/
├── apps/
│   ├── web-remote/          # React phone app
│   ├── signaling-server/    # Node.js signaling
│   └── desktop/             # Electron app
├── packages/
│   └── shared/              # Shared types
└── package.json
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Desktop**: Electron, nut.js (mouse/keyboard)
- **Backend**: Express, Socket.IO
- **Protocol**: WebRTC Data Channels, OSC

## License

MIT
