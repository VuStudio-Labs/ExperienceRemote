import { motion } from 'framer-motion';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionScreenProps {
  state: ConnectionState;
  roomCode: string;
  onRetry: () => void;
}

// Haptic feedback utility
function haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
}

export function ConnectionScreen({ state, roomCode, onRetry }: ConnectionScreenProps) {
  if (state === 'connected') return null;

  const handleRetry = () => {
    haptic('medium');
    onRetry();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-remote-bg flex flex-col items-center justify-center p-8 z-50"
    >
      {state === 'connecting' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-remote-accent/30 border-t-remote-accent rounded-full mb-6"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-white/60 text-center">
            Establishing secure connection
          </p>
          <div className="mt-4 px-4 py-2 bg-remote-surface rounded-lg border border-remote-border">
            <span className="text-remote-accent font-mono text-lg tracking-wider">
              {roomCode}
            </span>
          </div>
          <p className="text-white/40 text-sm mt-4 text-center">
            Make sure the desktop app is running
          </p>
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Failed</h2>
          <p className="text-white/60 text-center mb-2">
            Could not connect to the room.
          </p>
          <p className="text-white/40 text-sm text-center mb-6">
            Check that the desktop app is running and try again.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="px-6 py-3 bg-remote-accent rounded-xl text-white font-medium touch-feedback"
          >
            Try Again
          </motion.button>
        </motion.div>
      )}

      {state === 'disconnected' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            >
              <path d="M1 1l22 22" />
              <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
              <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0122.58 9" />
              <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
              <path d="M8.53 16.11a6 6 0 016.95 0" />
              <circle cx="12" cy="20" r="1" />
            </svg>
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Lost</h2>
          <p className="text-white/60 text-center mb-2">
            The connection to the desktop was lost.
          </p>
          <p className="text-white/40 text-sm text-center mb-6">
            Scan the QR code again to reconnect.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="px-6 py-3 bg-remote-accent rounded-xl text-white font-medium touch-feedback"
          >
            Reconnect
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
