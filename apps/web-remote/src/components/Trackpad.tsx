import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouch } from '../hooks/useTouch';

// Haptic feedback utility
function haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
}

interface TrackpadProps {
  onMove: (dx: number, dy: number) => void;
  onTap: () => void;
  onRightClick: () => void;
  onScroll: (dx: number, dy: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  id: number;
}

export function Trackpad({ onMove, onTap, onRightClick, onScroll }: TrackpadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchPoint, setTouchPoint] = useState<TouchPoint | null>(null);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const [isActive, setIsActive] = useState(false);
  const trailIdRef = useRef(0);
  const lastTrailTimeRef = useRef(0);

  // Handle touch position updates from the hook
  const handleTouchPosition = useCallback((x: number, y: number, active: boolean) => {
    if (active) {
      const now = Date.now();
      setTouchPoint({ x, y, id: now });
      setIsActive(true);

      // Add trail point every 16ms (60fps) for smooth trail
      if (now - lastTrailTimeRef.current > 16) {
        lastTrailTimeRef.current = now;
        trailIdRef.current++;
        setTrailPoints(prev => {
          const newPoints = [...prev, {
            x,
            y,
            opacity: 0.6,
            scale: 1,
            id: trailIdRef.current,
          }];
          // Keep only last 12 points for performance
          return newPoints.slice(-12);
        });
      }
    } else {
      setIsActive(false);
      setTouchPoint(null);
    }
  }, []);

  // Animate trail points fading out
  useEffect(() => {
    if (trailPoints.length === 0) return;

    const interval = setInterval(() => {
      setTrailPoints(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            opacity: p.opacity * 0.85,
            scale: p.scale * 0.92,
          }))
          .filter(p => p.opacity > 0.05);
        return updated;
      });
    }, 32);

    return () => clearInterval(interval);
  }, [trailPoints.length > 0]);

  const touchHandlers = useTouch({
    onMove: (dx, dy) => {
      onMove(dx, dy);
    },
    onTap: () => {
      haptic('light');
      onTap();
    },
    onTwoFingerTap: () => {
      haptic('medium');
      onRightClick();
    },
    onScroll: (dx, dy) => {
      onScroll(dx, dy);
    },
    onTouchPosition: handleTouchPosition,
    sensitivity: 1.5, // Slightly amplified for usability on small phone screens
  });

  return (
    <div
      ref={containerRef}
      className="relative flex-1 rounded-2xl overflow-hidden"
      onTouchStart={touchHandlers.onTouchStart}
      onTouchMove={touchHandlers.onTouchMove}
      onTouchEnd={touchHandlers.onTouchEnd}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 35, 0.95), rgba(20, 20, 25, 0.98))',
      }}
    >
      {/* Glowing animated border */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1px',
          background: isActive
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.6), rgba(236, 72, 153, 0.4), rgba(99, 102, 241, 0.8))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.3))',
          backgroundSize: '400% 400%',
          animation: 'borderGlow 4s ease infinite',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'background 0.3s ease',
        }}
      />

      {/* Outer glow effect when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.3), 0 0 60px rgba(168, 85, 247, 0.15), inset 0 0 30px rgba(99, 102, 241, 0.05)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Trail effect - fluid-like following points */}
      {trailPoints.map((point) => (
        <div
          key={point.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: point.x - 20 * point.scale,
            top: point.y - 20 * point.scale,
            width: 40 * point.scale,
            height: 40 * point.scale,
            background: `radial-gradient(circle, rgba(99, 102, 241, ${point.opacity * 0.5}) 0%, rgba(168, 85, 247, ${point.opacity * 0.3}) 50%, transparent 70%)`,
            filter: 'blur(8px)',
            transform: `scale(${point.scale})`,
          }}
        />
      ))}

      {/* Active touch point with glow */}
      <AnimatePresence>
        {touchPoint && isActive && (
          <motion.div
            key={touchPoint.id}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute pointer-events-none"
            style={{
              left: touchPoint.x - 30,
              top: touchPoint.y - 30,
              width: 60,
              height: 60,
            }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(168, 85, 247, 0.2) 40%, transparent 70%)',
                filter: 'blur(10px)',
                transform: 'scale(1.5)',
              }}
            />
            {/* Inner bright point */}
            <div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: 16,
                height: 16,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(99, 102, 241, 0.8) 60%, transparent 100%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on touch start */}
      <AnimatePresence>
        {touchPoint && (
          <motion.div
            key={`ripple-${touchPoint.id}`}
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: touchPoint.x - 40,
              top: touchPoint.y - 40,
              width: 80,
              height: 80,
              border: '2px solid rgba(99, 102, 241, 0.5)',
              background: 'transparent',
            }}
          />
        )}
      </AnimatePresence>

      {/* Center hint - only visible when not active */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-white/25 text-sm font-light tracking-wider"
            >
              Trackpad
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS animation for border glow */}
      <style>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
