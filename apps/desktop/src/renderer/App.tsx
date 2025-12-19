import { useState, useEffect } from 'react';

interface RoomData {
  roomCode: string;
  qrDataUrl: string;
  remoteUrl: string;
}

type ConnectionState = 'waiting' | 'connecting' | 'connected' | 'error';

declare global {
  interface Window {
    electronAPI: {
      onRoomCreated: (callback: (data: RoomData) => void) => void;
      onConnectionState: (callback: (state: string) => void) => void;
      getRoomData: () => Promise<RoomData | null>;
      getSettings: () => Promise<{ oscHost: string; oscPort: number }>;
      updateOscSettings: (settings: { host: string; port: number }) => Promise<boolean>;
      regenerateRoom: () => Promise<RoomData | null>;
    };
  }
}

function App() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('waiting');
  const [showSettings, setShowSettings] = useState(false);
  const [oscHost, setOscHost] = useState('127.0.0.1');
  const [oscPort, setOscPort] = useState(9000);

  useEffect(() => {
    // Listen for room creation
    window.electronAPI.onRoomCreated((data) => {
      setRoomData(data);
    });

    // Listen for connection state changes
    window.electronAPI.onConnectionState((state) => {
      setConnectionState(state as ConnectionState);
    });

    // Load initial room data (in case event was missed)
    window.electronAPI.getRoomData().then((data) => {
      if (data) {
        setRoomData(data);
      }
    });

    // Load initial settings
    window.electronAPI.getSettings().then((settings) => {
      setOscHost(settings.oscHost);
      setOscPort(settings.oscPort);
    });
  }, []);

  const handleRegenerateRoom = async () => {
    const newRoom = await window.electronAPI.regenerateRoom();
    if (newRoom) {
      setRoomData(newRoom);
      setConnectionState('waiting');
    }
  };

  const handleSaveSettings = async () => {
    await window.electronAPI.updateOscSettings({ host: oscHost, port: oscPort });
    setShowSettings(false);
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Waiting for connection';
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Title bar area */}
      <div className="h-8 flex items-center justify-center text-white/60 text-sm">
        Experience Remote
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* QR Code */}
        {roomData ? (
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <img
              src={roomData.qrDataUrl}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
        ) : (
          <div className="w-48 h-48 bg-app-surface rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-app-accent/30 border-t-app-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Instructions */}
        <p className="mt-6 text-white/60 text-center">
          Scan to connect
        </p>

        {/* Room code */}
        {roomData && (
          <div className="mt-2 px-4 py-2 bg-app-surface rounded-lg border border-app-border">
            <span className="text-app-accent font-mono text-xl tracking-widest">
              {roomData.roomCode}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="mt-6 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-white/60 text-sm">{getStatusText()}</span>
        </div>

        {/* Regenerate button */}
        {connectionState !== 'connected' && (
          <button
            onClick={handleRegenerateRoom}
            className="mt-4 px-4 py-2 text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            Generate new code
          </button>
        )}
      </div>

      {/* Settings bar */}
      <div className="p-4 border-t border-app-border">
        {showSettings ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={oscHost}
                onChange={(e) => setOscHost(e.target.value)}
                placeholder="OSC Host"
                className="flex-1 px-3 py-2 bg-app-surface border border-app-border rounded-lg
                           text-white text-sm outline-none focus:border-app-accent"
              />
              <input
                type="number"
                value={oscPort}
                onChange={(e) => setOscPort(parseInt(e.target.value) || 9000)}
                placeholder="Port"
                className="w-20 px-3 py-2 bg-app-surface border border-app-border rounded-lg
                           text-white text-sm outline-none focus:border-app-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2 bg-app-accent rounded-lg text-white text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            <span>Chataigne OSC: {oscHost}:{oscPort}</span>
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
