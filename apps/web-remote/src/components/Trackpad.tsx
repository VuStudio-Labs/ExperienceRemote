import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTouch } from '../hooks/useTouch';

interface TrackpadProps {
  onMove: (dx: number, dy: number) => void;
  onTap: () => void;
  onRightClick: () => void;
  onScroll: (dx: number, dy: number) => void;
}

export function Trackpad({ onMove, onTap, onRightClick, onScroll }: TrackpadProps) {
  const touchPointRef = useRef<{ x: number; y: number } | null>(null);

  const touchHandlers = useTouch({
    onMove: (dx, dy) => {
      onMove(dx, dy);
    },
    onTap: () => {
      onTap();
    },
    onTwoFingerTap: () => {
      onRightClick();
    },
    onScroll: (dx, dy) => {
      onScroll(dx, dy);
    },
    sensitivity: 1.5,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchPointRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    touchHandlers.onTouchStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchPointRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    touchHandlers.onTouchMove(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchPointRef.current = null;
    touchHandlers.onTouchEnd(e);
  };

  return (
    <div
      className="relative flex-1 rounded-2xl bg-remote-surface border border-remote-border overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Center hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/30 text-sm"
        >
          Trackpad
        </motion.div>
      </div>

      {/* Touch feedback ripple */}
      {touchPointRef.current && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute w-20 h-20 rounded-full bg-remote-accent pointer-events-none"
          style={{
            left: touchPointRef.current.x - 40,
            top: touchPointRef.current.y - 40,
          }}
        />
      )}
    </div>
  );
}
