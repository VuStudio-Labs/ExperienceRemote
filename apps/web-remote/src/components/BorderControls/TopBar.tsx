import { motion } from 'framer-motion';

// Haptic feedback utility
function haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
}

interface TopBarProps {
  onMediaAction: (action: 'play_pause' | 'prev' | 'next') => void;
  onVolumeChange: (delta: number) => void;
  onOSCTrigger: (trigger: 1 | 2 | 3) => void;
}

export function TopBar({ onMediaAction, onVolumeChange, onOSCTrigger }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 glass rounded-xl border border-remote-border">
      {/* Media Controls */}
      <div className="flex items-center gap-1">
        <MediaButton onClick={() => onMediaAction('prev')}>
          <SkipBackIcon />
        </MediaButton>
        <MediaButton onClick={() => onMediaAction('play_pause')} large>
          <PlayPauseIcon />
        </MediaButton>
        <MediaButton onClick={() => onMediaAction('next')}>
          <SkipForwardIcon />
        </MediaButton>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1">
        <MediaButton onClick={() => onVolumeChange(-10)}>
          <VolumeDownIcon />
        </MediaButton>
        <MediaButton onClick={() => onVolumeChange(10)}>
          <VolumeUpIcon />
        </MediaButton>
      </div>

      {/* OSC Triggers */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              haptic('medium');
              onOSCTrigger(n as 1 | 2 | 3);
            }}
            className="w-10 h-10 rounded-lg bg-remote-accent/20 border border-remote-accent/30
                       text-remote-accent font-bold text-sm touch-feedback
                       active:bg-remote-accent/40"
          >
            {n}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MediaButton({
  onClick,
  children,
  large = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  large?: boolean;
}) {
  const handleClick = () => {
    haptic('light');
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`${
        large ? 'w-12 h-12' : 'w-10 h-10'
      } rounded-lg bg-white/5 border border-white/10
         flex items-center justify-center text-white/80 touch-feedback
         active:bg-white/10`}
    >
      {children}
    </motion.button>
  );
}

function SkipBackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function PlayPauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
    </svg>
  );
}

function VolumeDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  );
}

function VolumeUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}
