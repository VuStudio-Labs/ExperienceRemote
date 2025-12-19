// Mouse/Trackpad events
export interface MouseMoveMessage {
  type: 'mouse_move';
  dx: number;
  dy: number;
}

export interface ClickMessage {
  type: 'click';
  button: 'left' | 'right' | 'middle';
}

export interface MouseDownMessage {
  type: 'mouse_down';
  button: 'left' | 'right' | 'middle';
}

export interface MouseUpMessage {
  type: 'mouse_up';
  button: 'left' | 'right' | 'middle';
}

export interface ScrollMessage {
  type: 'scroll';
  dx: number;
  dy: number;
}

// Gyroscope events
export interface GyroMessage {
  type: 'gyro';
  dx: number;
  dy: number;
}

export interface GyroCalibrateMessage {
  type: 'gyro_calibrate';
}

// Keyboard events
export interface KeyMessage {
  type: 'key';
  key: string;
  action: 'down' | 'up' | 'press';
}

export interface TextMessage {
  type: 'text';
  text: string;
}

// Media controls
export interface MediaMessage {
  type: 'media';
  action: 'play_pause' | 'next' | 'prev' | 'vol_up' | 'vol_down';
  value?: number;
}

// Navigation
export interface NavigateMessage {
  type: 'navigate';
  direction: 'up' | 'down' | 'left' | 'right';
}

// Custom OSC triggers
export interface OSCTriggerMessage {
  type: 'osc';
  trigger: 1 | 2 | 3;
  address?: string;
}

// Connection health
export interface PingMessage {
  type: 'ping';
  timestamp: number;
}

export interface PongMessage {
  type: 'pong';
  timestamp: number;
}

// Union type for all messages
export type RemoteMessage =
  | MouseMoveMessage
  | ClickMessage
  | MouseDownMessage
  | MouseUpMessage
  | ScrollMessage
  | GyroMessage
  | GyroCalibrateMessage
  | KeyMessage
  | TextMessage
  | MediaMessage
  | NavigateMessage
  | OSCTriggerMessage
  | PingMessage
  | PongMessage;

// Type guard helper
export function isRemoteMessage(data: unknown): data is RemoteMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as { type: unknown }).type === 'string'
  );
}
