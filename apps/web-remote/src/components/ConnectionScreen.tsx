import { motion } from 'framer-motion';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionScreenProps {
  state: ConnectionState;
  roomCode: string;
  onRetry: () => void;
}

export function ConnectionScreen({ state, roomCode, onRetry }: ConnectionScreenProps) {
  if (state === 'connected') return null;

  return (
    <div className="absolute inset-0 bg-remote-bg flex flex-col items-center justify-center p-8 z-50">
      {state === 'connecting' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-remote-accent/30 border-t-remote-accent rounded-full mb-6"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-white/60 text-center">
            Establishing secure connection to room
          </p>
          <div className="mt-4 px-4 py-2 bg-remote-surface rounded-lg border border-remote-border">
            <span className="text-remote-accent font-mono text-lg tracking-wider">
              {roomCode}
            </span>
          </div>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
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
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Failed</h2>
          <p className="text-white/60 text-center mb-6">
            Could not connect to room. The session may have expired.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-3 bg-remote-accent rounded-xl text-white font-medium touch-feedback"
          >
            Try Again
          </motion.button>
        </>
      )}

      {state === 'disconnected' && (
        <>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/60"
            >
              <path d="M1 1l22 22" />
              <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
              <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0122.58 9" />
              <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
              <path d="M8.53 16.11a6 6 0 016.95 0" />
              <circle cx="12" cy="20" r="1" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Disconnected</h2>
          <p className="text-white/60 text-center mb-6">
            The connection was lost. Please scan the QR code again.
          </p>
        </>
      )}
    </div>
  );
}
