import { useState, useEffect, useCallback } from 'react';
import { Trackpad } from './components/Trackpad';
import { TopBar } from './components/BorderControls/TopBar';
import { SideControls } from './components/BorderControls/SideControls';
import { BottomBar } from './components/BorderControls/BottomBar';
import { Keyboard } from './components/Keyboard';
import { ConnectionScreen } from './components/ConnectionScreen';
import { useWebRTC } from './hooks/useWebRTC';
import { useGyroscope } from './hooks/useGyroscope';
import { connectSocket, getRoomCodeFromUrl } from './lib/signaling';

function App() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const { connectionState, connect, send } = useWebRTC();

  const handleGyroMove = useCallback(
    (dx: number, dy: number) => {
      send({ type: 'gyro', dx, dy });
    },
    [send]
  );

  const gyroscope = useGyroscope({
    onMove: handleGyroMove,
    sensitivity: 1.0,
  });

  // Extract room code from URL (query param or path) and connect
  useEffect(() => {
    const code = getRoomCodeFromUrl();

    if (code && code.length === 6) {
      setRoomCode(code);
      connectSocket()
        .then(() => connect(code))
        .catch((err) => console.error('Connection error:', err));
    }
  }, [connect]);

  const handleRetry = useCallback(() => {
    if (roomCode) {
      connectSocket()
        .then(() => connect(roomCode))
        .catch((err) => console.error('Retry error:', err));
    }
  }, [roomCode, connect]);

  // Mouse handlers
  const handleMove = useCallback(
    (dx: number, dy: number) => {
      send({ type: 'mouse_move', dx, dy });
    },
    [send]
  );

  const handleTap = useCallback(() => {
    send({ type: 'click', button: 'left' });
  }, [send]);

  const handleRightClick = useCallback(() => {
    send({ type: 'click', button: 'right' });
  }, [send]);

  const handleScroll = useCallback(
    (dx: number, dy: number) => {
      send({ type: 'scroll', dx, dy });
    },
    [send]
  );

  // Media handlers
  const handleMediaAction = useCallback(
    (action: 'play_pause' | 'prev' | 'next') => {
      send({ type: 'media', action });
    },
    [send]
  );

  const handleVolumeChange = useCallback(
    (delta: number) => {
      send({ type: 'media', action: delta > 0 ? 'vol_up' : 'vol_down' });
    },
    [send]
  );

  const handleOSCTrigger = useCallback(
    (trigger: 1 | 2 | 3) => {
      send({ type: 'osc', trigger });
    },
    [send]
  );

  // Navigation handler
  const handleNavigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      send({ type: 'navigate', direction });
    },
    [send]
  );

  // Keyboard handlers
  const handleKeyPress = useCallback(
    (key: string) => {
      send({ type: 'key', key, action: 'press' });
    },
    [send]
  );

  const handleTextSubmit = useCallback(
    (text: string) => {
      send({ type: 'text', text });
    },
    [send]
  );

  // Gyro toggle
  const handleGyroToggle = useCallback(async () => {
    if (gyroscope.isEnabled) {
      gyroscope.disable();
    } else {
      try {
        await gyroscope.enable();
      } catch (err) {
        console.error('Gyro error:', err);
      }
    }
  }, [gyroscope]);

  return (
    <div className="h-full w-full flex flex-col p-3 gap-3 relative">
      <ConnectionScreen
        state={connectionState}
        roomCode={roomCode}
        onRetry={handleRetry}
      />

      {/* Top Bar */}
      <TopBar
        onMediaAction={handleMediaAction}
        onVolumeChange={handleVolumeChange}
        onOSCTrigger={handleOSCTrigger}
      />

      {/* Main area with side controls and trackpad */}
      <div className="flex-1 flex gap-2 min-h-0">
        <SideControls side="left" onNavigate={handleNavigate} />

        <Trackpad
          onMove={handleMove}
          onTap={handleTap}
          onRightClick={handleRightClick}
          onScroll={handleScroll}
        />

        <SideControls side="right" onNavigate={handleNavigate} />
      </div>

      {/* Bottom Bar */}
      <BottomBar
        onLeftClick={handleTap}
        onRightClick={handleRightClick}
        onGyroToggle={handleGyroToggle}
        onKeyboardToggle={() => setIsKeyboardOpen(!isKeyboardOpen)}
        onSettingsToggle={() => {}}
        isGyroEnabled={gyroscope.isEnabled}
        isKeyboardOpen={isKeyboardOpen}
      />

      {/* Virtual Keyboard */}
      <Keyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onKeyPress={handleKeyPress}
        onTextSubmit={handleTextSubmit}
      />
    </div>
  );
}

export default App;
