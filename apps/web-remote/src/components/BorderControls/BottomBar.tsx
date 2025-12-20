import { motion } from 'framer-motion';

// Haptic feedback utility
function haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
}

interface BottomBarProps {
  onLeftClick: () => void;
  onRightClick: () => void;
  onGyroToggle: () => void;
  onKeyboardToggle: () => void;
  onSettingsToggle: () => void;
  isGyroEnabled: boolean;
  isKeyboardOpen: boolean;
}

export function BottomBar({
  onLeftClick,
  onRightClick,
  onGyroToggle,
  onKeyboardToggle,
  onSettingsToggle,
  isGyroEnabled,
  isKeyboardOpen,
}: BottomBarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Click buttons */}
      <div className="flex gap-2">
        <ClickButton onClick={onLeftClick} label="L" />
        <ClickButton onClick={onRightClick} label="R" />
      </div>

      {/* Mode toggles */}
      <div className="flex justify-center gap-3">
        <ToggleButton
          onClick={onGyroToggle}
          isActive={isGyroEnabled}
          icon={<GyroIcon />}
          label="Gyro"
        />
        <ToggleButton
          onClick={onKeyboardToggle}
          isActive={isKeyboardOpen}
          icon={<KeyboardIcon />}
          label="Keys"
        />
        <ToggleButton
          onClick={onSettingsToggle}
          isActive={false}
          icon={<SettingsIcon />}
          label="Settings"
        />
      </div>
    </div>
  );
}

function ClickButton({ onClick, label }: { onClick: () => void; label: string }) {
  const handleClick = () => {
    haptic('medium');
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="flex-1 h-14 rounded-xl glass border border-remote-border
                 flex items-center justify-center text-white/80 font-medium
                 touch-feedback active:bg-white/10"
    >
      {label} Click
    </motion.button>
  );
}

function ToggleButton({
  onClick,
  isActive,
  icon,
  label,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const handleClick = () => {
    haptic('light');
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg touch-feedback
        ${
          isActive
            ? 'bg-remote-accent/20 border border-remote-accent/50 text-remote-accent'
            : 'bg-white/5 border border-white/10 text-white/60'
        }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </motion.button>
  );
}

function GyroIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
