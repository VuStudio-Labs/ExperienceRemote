import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SideControlsProps {
  side: 'left' | 'right';
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function SideControls({ side, onNavigate }: SideControlsProps) {
  const repeatTimerRef = useRef<number | null>(null);

  const startRepeat = useCallback(
    (direction: 'up' | 'down') => {
      onNavigate(direction);
      repeatTimerRef.current = window.setInterval(() => {
        onNavigate(direction);
      }, 100);
    },
    [onNavigate]
  );

  const stopRepeat = useCallback(() => {
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col gap-2 py-4">
      <NavButton
        onTouchStart={() => startRepeat('up')}
        onTouchEnd={stopRepeat}
      >
        <ChevronUpIcon />
      </NavButton>

      {side === 'left' ? (
        <NavButton
          onTouchStart={() => onNavigate('left')}
          onTouchEnd={() => {}}
        >
          <ChevronLeftIcon />
        </NavButton>
      ) : (
        <NavButton
          onTouchStart={() => onNavigate('right')}
          onTouchEnd={() => {}}
        >
          <ChevronRightIcon />
        </NavButton>
      )}

      <NavButton
        onTouchStart={() => startRepeat('down')}
        onTouchEnd={stopRepeat}
      >
        <ChevronDownIcon />
      </NavButton>
    </div>
  );
}

function NavButton({
  onTouchStart,
  onTouchEnd,
  children,
}: {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onTouchEnd();
      }}
      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10
                 flex items-center justify-center text-white/60 touch-feedback
                 active:bg-white/15 active:text-white"
    >
      {children}
    </motion.button>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
