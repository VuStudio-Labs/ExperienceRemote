import { useCallback, useRef } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  lastMoveTime: number;
  touchCount: number;
}

interface UseTouchOptions {
  onMove?: (dx: number, dy: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onTwoFingerTap?: () => void;
  onScroll?: (dx: number, dy: number) => void;
  onLongPress?: () => void;
  sensitivity?: number;
  // Touch position callback for visual feedback
  onTouchPosition?: (x: number, y: number, isActive: boolean) => void;
}

// Minimum movement threshold to filter out jitter (in raw pixels)
const MOVEMENT_DEAD_ZONE = 1.0;  // Increased to filter more jitter

export function useTouch(options: UseTouchOptions) {
  const {
    onMove,
    onTap,
    onDoubleTap,
    onTwoFingerTap,
    onScroll,
    onLongPress,
    onTouchPosition,
    sensitivity = 1.0,  // Default 1:1 sensitivity
  } = options;

  const touchState = useRef<TouchState | null>(null);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<number | null>(null);
  const hasMoved = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      hasMoved.current = false;

      const now = Date.now();
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        startTime: now,
        lastMoveTime: now,
        touchCount: e.touches.length,
      };

      // Notify touch position for visual feedback
      if (onTouchPosition) {
        const rect = e.currentTarget.getBoundingClientRect();
        onTouchPosition(
          touch.clientX - rect.left,
          touch.clientY - rect.top,
          true
        );
      }

      // Long press detection
      if (e.touches.length === 1 && onLongPress) {
        longPressTimer.current = window.setTimeout(() => {
          if (!hasMoved.current) {
            onLongPress();
          }
        }, 500);
      }
    },
    [onLongPress, onTouchPosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchState.current) return;

      const touch = e.touches[0];
      const now = Date.now();

      // Calculate raw delta
      const rawDx = touch.clientX - touchState.current.lastX;
      const rawDy = touch.clientY - touchState.current.lastY;

      // Apply dead zone to filter out jitter and tiny movements
      const rawMagnitude = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      if (rawMagnitude < MOVEMENT_DEAD_ZONE) {
        // Still update visual feedback and position tracking, but don't send movement
        if (onTouchPosition) {
          const rect = e.currentTarget.getBoundingClientRect();
          onTouchPosition(
            touch.clientX - rect.left,
            touch.clientY - rect.top,
            true
          );
        }
        // Update position tracking to prevent accumulation jumps
        touchState.current.lastX = touch.clientX;
        touchState.current.lastY = touch.clientY;
        touchState.current.lastMoveTime = now;
        return;
      }

      // Simple direct mapping - no acceleration, just sensitivity
      // This gives predictable 1:1 control like a real mouse
      const dx = rawDx * sensitivity;
      const dy = rawDy * sensitivity;

      // Notify touch position for visual feedback
      if (onTouchPosition) {
        const rect = e.currentTarget.getBoundingClientRect();
        onTouchPosition(
          touch.clientX - rect.left,
          touch.clientY - rect.top,
          true
        );
      }

      // Check if we've moved enough to cancel tap detection
      const totalDx = touch.clientX - touchState.current.startX;
      const totalDy = touch.clientY - touchState.current.startY;
      if (Math.abs(totalDx) > 10 || Math.abs(totalDy) > 10) {
        hasMoved.current = true;
        clearLongPressTimer();
      }

      if (e.touches.length === 1 && onMove) {
        onMove(dx, dy);
      } else if (e.touches.length === 2 && onScroll) {
        // Two-finger scroll - use lower multiplier for precision
        onScroll(-rawDx * sensitivity * 0.5, -rawDy * sensitivity * 0.5);
      }

      touchState.current.lastX = touch.clientX;
      touchState.current.lastY = touch.clientY;
      touchState.current.lastMoveTime = now;
    },
    [onMove, onScroll, sensitivity, clearLongPressTimer, onTouchPosition]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      clearLongPressTimer();

      // Notify touch ended for visual feedback
      if (onTouchPosition) {
        onTouchPosition(0, 0, false);
      }

      if (!touchState.current) return;

      const duration = Date.now() - touchState.current.startTime;
      const wasQuickTap = duration < 200;
      const touchCount = touchState.current.touchCount;

      if (!hasMoved.current && wasQuickTap) {
        if (touchCount === 2 && onTwoFingerTap) {
          onTwoFingerTap();
        } else if (touchCount === 1) {
          const now = Date.now();
          if (now - lastTapTime.current < 300 && onDoubleTap) {
            onDoubleTap();
            lastTapTime.current = 0;
          } else if (onTap) {
            // Delay tap to check for double tap
            setTimeout(() => {
              if (Date.now() - lastTapTime.current >= 300) {
                onTap();
              }
            }, 300);
            lastTapTime.current = now;
          }
        }
      }

      touchState.current = null;
    },
    [onTap, onDoubleTap, onTwoFingerTap, clearLongPressTimer, onTouchPosition]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
