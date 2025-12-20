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

interface AccelerationConfig {
  // Minimum velocity (px/ms) below which no acceleration is applied
  minVelocityThreshold: number;
  // Maximum velocity (px/ms) at which acceleration curve saturates
  maxVelocity: number;
  // Acceleration curve exponent (1 = linear, 2 = quadratic, etc.)
  curveExponent: number;
  // Base multiplier for output
  baseMultiplier: number;
  // Maximum acceleration factor
  maxAcceleration: number;
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

/**
 * Calculate acceleration factor based on velocity using a curve similar to macOS/Windows trackpads.
 *
 * The curve provides:
 * - Precise control at low speeds (minimal acceleration)
 * - Natural acceleration at medium speeds
 * - Capped acceleration at high speeds to prevent overshooting
 */
function calculateAcceleration(velocity: number, config: AccelerationConfig): number {
  // Below threshold, use minimal acceleration for precision
  if (velocity < config.minVelocityThreshold) {
    return config.baseMultiplier * 0.8;
  }

  // Normalize velocity to 0-1 range
  const normalizedVelocity = Math.min(
    (velocity - config.minVelocityThreshold) / (config.maxVelocity - config.minVelocityThreshold),
    1
  );

  // Apply sigmoid-like curve for natural feel
  // This approximates the "pointer ballistics" feel of modern trackpads
  const curvedVelocity = Math.pow(normalizedVelocity, config.curveExponent);

  // Calculate acceleration factor
  const accelerationRange = config.maxAcceleration - config.baseMultiplier;
  const acceleration = config.baseMultiplier + (curvedVelocity * accelerationRange);

  return acceleration;
}

// Default acceleration configuration tuned for natural trackpad feel
// Calibrated to match macOS/Windows pointer ballistics
const DEFAULT_ACCELERATION: AccelerationConfig = {
  minVelocityThreshold: 0.15,  // px/ms - below this, precision mode (higher = more precision)
  maxVelocity: 1.5,            // px/ms - above this, max acceleration (lowered for smoother curve)
  curveExponent: 1.2,          // Gentler curve for more predictable acceleration
  baseMultiplier: 1.0,         // Base output multiplier
  maxAcceleration: 2.2,        // Maximum acceleration factor (reduced from 4.0 for accuracy)
};

// Minimum movement threshold to filter out jitter (in raw pixels)
const MOVEMENT_DEAD_ZONE = 0.5;

export function useTouch(options: UseTouchOptions) {
  const {
    onMove,
    onTap,
    onDoubleTap,
    onTwoFingerTap,
    onScroll,
    onLongPress,
    onTouchPosition,
    sensitivity = 1.0,  // Default 1:1 sensitivity, let acceleration handle the curve
  } = options;

  const touchState = useRef<TouchState | null>(null);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<number | null>(null);
  const hasMoved = useRef(false);

  // Velocity smoothing using exponential moving average
  const velocityHistory = useRef<{ vx: number; vy: number }[]>([]);
  const VELOCITY_HISTORY_SIZE = 3;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Calculate smoothed velocity from recent history
  const getSmoothedVelocity = useCallback((currentVx: number, currentVy: number) => {
    velocityHistory.current.push({ vx: currentVx, vy: currentVy });
    if (velocityHistory.current.length > VELOCITY_HISTORY_SIZE) {
      velocityHistory.current.shift();
    }

    // Weighted average with more recent values having higher weight
    let totalWeight = 0;
    let weightedVx = 0;
    let weightedVy = 0;

    velocityHistory.current.forEach((v, i) => {
      const weight = i + 1; // More recent = higher weight
      weightedVx += v.vx * weight;
      weightedVy += v.vy * weight;
      totalWeight += weight;
    });

    return {
      vx: weightedVx / totalWeight,
      vy: weightedVy / totalWeight,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      hasMoved.current = false;
      velocityHistory.current = []; // Reset velocity history

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

      // Calculate time delta (minimum 1ms to avoid division by zero)
      const timeDelta = Math.max(now - touchState.current.lastMoveTime, 1);

      // Get smoothed velocity for more stable acceleration
      const smoothed = getSmoothedVelocity(rawDx / timeDelta, rawDy / timeDelta);
      const smoothedVelocity = Math.sqrt(smoothed.vx * smoothed.vx + smoothed.vy * smoothed.vy);

      // Calculate acceleration factor based on velocity
      const accelerationFactor = calculateAcceleration(smoothedVelocity, DEFAULT_ACCELERATION);

      // Apply acceleration and sensitivity
      const dx = rawDx * accelerationFactor * sensitivity;
      const dy = rawDy * accelerationFactor * sensitivity;

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
    [onMove, onScroll, sensitivity, clearLongPressTimer, getSmoothedVelocity, onTouchPosition]
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
