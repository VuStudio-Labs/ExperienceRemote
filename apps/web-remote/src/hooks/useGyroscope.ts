import { useState, useRef, useCallback, useEffect } from 'react';

interface UseGyroscopeOptions {
  onMove?: (dx: number, dy: number) => void;
  sensitivity?: number;
}

interface UseGyroscopeReturn {
  isEnabled: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  enable: () => Promise<void>;
  disable: () => void;
  calibrate: () => void;
}

export function useGyroscope(options: UseGyroscopeOptions): UseGyroscopeReturn {
  const { onMove, sensitivity = 1.0 } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported] = useState(() => 'DeviceOrientationEvent' in window);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const calibrationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const lastOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (!isEnabled || !onMove) return;

      const alpha = event.alpha || 0;
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;

      // Calculate delta from last position
      const dx =
        (gamma - lastOrientationRef.current.gamma - calibrationRef.current.gamma) *
        sensitivity *
        0.5;
      const dy =
        (beta - lastOrientationRef.current.beta - calibrationRef.current.beta) *
        sensitivity *
        0.5;

      // Apply threshold to reduce noise
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        onMove(dx, dy);
      }

      lastOrientationRef.current = { alpha, beta, gamma };
    },
    [isEnabled, onMove, sensitivity]
  );

  const calibrate = useCallback(() => {
    calibrationRef.current = { ...lastOrientationRef.current };
  }, []);

  const enable = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Gyroscope not supported on this device');
    }

    // Request permission on iOS 13+
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permission !== 'granted') {
          setHasPermission(false);
          throw new Error('Gyroscope permission denied');
        }
        setHasPermission(true);
      } catch (error) {
        setHasPermission(false);
        throw error;
      }
    } else {
      setHasPermission(true);
    }

    setIsEnabled(true);
    calibrate();
  }, [isSupported, calibrate]);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [isEnabled, handleOrientation]);

  return {
    isEnabled,
    isSupported,
    hasPermission,
    enable,
    disable,
    calibrate,
  };
}
