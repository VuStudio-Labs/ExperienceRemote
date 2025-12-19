import { useCallback, useRef } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
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
}

export function useTouch(options: UseTouchOptions) {
  const {
    onMove,
    onTap,
    onDoubleTap,
    onTwoFingerTap,
    onScroll,
    onLongPress,
    sensitivity = 1.5,
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

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        startTime: Date.now(),
        touchCount: e.touches.length,
      };

      // Long press detection
      if (e.touches.length === 1 && onLongPress) {
        longPressTimer.current = window.setTimeout(() => {
          if (!hasMoved.current) {
            onLongPress();
          }
        }, 500);
      }
    },
    [onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchState.current) return;

      const touch = e.touches[0];
      const dx = (touch.clientX - touchState.current.lastX) * sensitivity;
      const dy = (touch.clientY - touchState.current.lastY) * sensitivity;

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
        // Two-finger scroll
        onScroll(-dx * 0.5, -dy * 0.5);
      }

      touchState.current.lastX = touch.clientX;
      touchState.current.lastY = touch.clientY;
    },
    [onMove, onScroll, sensitivity, clearLongPressTimer]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      clearLongPressTimer();

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
    [onTap, onDoubleTap, onTwoFingerTap, clearLongPressTimer]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
