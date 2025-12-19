import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (key: string) => void;
  onTextSubmit: (text: string) => void;
}

const LAYOUTS = {
  letters: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['123', 'space', 'return'],
  ],
  numbers: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['#+=', '.', ',', '?', '!', "'", 'backspace'],
    ['ABC', 'space', 'return'],
  ],
  symbols: [
    ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
    ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
    ['123', '.', ',', '?', '!', "'", 'backspace'],
    ['ABC', 'space', 'return'],
  ],
};

export function Keyboard({ isOpen, onClose, onKeyPress, onTextSubmit }: KeyboardProps) {
  const [text, setText] = useState('');
  const [layout, setLayout] = useState<'letters' | 'numbers' | 'symbols'>('letters');
  const [isShift, setIsShift] = useState(false);

  const handleKeyPress = (key: string) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    switch (key) {
      case 'shift':
        setIsShift(!isShift);
        break;
      case 'backspace':
        setText(text.slice(0, -1));
        onKeyPress('Backspace');
        break;
      case 'space':
        setText(text + ' ');
        onKeyPress(' ');
        break;
      case 'return':
        if (text) {
          onTextSubmit(text);
          setText('');
        }
        onKeyPress('Enter');
        break;
      case '123':
        setLayout('numbers');
        break;
      case 'ABC':
        setLayout('letters');
        break;
      case '#+=':
        setLayout('symbols');
        break;
      default:
        const char = isShift ? key.toUpperCase() : key;
        setText(text + char);
        onKeyPress(char);
        if (isShift) setIsShift(false);
    }
  };

  const currentLayout = LAYOUTS[layout];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 glass border-t border-remote-border"
        >
          {/* Text input display */}
          <div className="flex items-center gap-2 p-3 border-b border-remote-border">
            <input
              type="text"
              value={text}
              readOnly
              placeholder="Type something..."
              className="flex-1 bg-remote-surface border border-remote-border rounded-lg px-3 py-2
                         text-white placeholder-white/30 outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (text) {
                  onTextSubmit(text);
                  setText('');
                }
              }}
              className="px-4 py-2 bg-remote-accent rounded-lg text-white font-medium touch-feedback"
            >
              Send
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-white/60"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Keyboard rows */}
          <div className="p-2 pb-6">
            {currentLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1 mb-1">
                {row.map((key) => (
                  <Key
                    key={key}
                    label={key}
                    isShift={isShift}
                    onPress={() => handleKeyPress(key)}
                  />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Key({
  label,
  isShift,
  onPress,
}: {
  label: string;
  isShift: boolean;
  onPress: () => void;
}) {
  const isSpecial = ['shift', 'backspace', 'space', 'return', '123', 'ABC', '#+='].includes(label);
  const displayLabel = getKeyDisplay(label, isShift);

  const width = label === 'space' ? 'flex-1' : isSpecial ? 'w-12' : 'w-8';

  return (
    <motion.button
      whileTap={{ scale: 0.9, backgroundColor: 'rgba(99, 102, 241, 0.3)' }}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`${width} h-11 rounded-lg flex items-center justify-center
                  text-white font-medium touch-feedback
                  ${isSpecial ? 'bg-white/10' : 'bg-white/5'}
                  ${label === 'shift' && isShift ? 'bg-remote-accent/30 text-remote-accent' : ''}`}
    >
      {displayLabel}
    </motion.button>
  );
}

function getKeyDisplay(key: string, isShift: boolean): React.ReactNode {
  switch (key) {
    case 'shift':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4l8 8h-5v8h-6v-8H4l8-8z" />
        </svg>
      );
    case 'backspace':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
          <path d="M18 9l-6 6M12 9l6 6" />
        </svg>
      );
    case 'return':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 10l-5 5 5 5" />
          <path d="M20 4v7a4 4 0 01-4 4H4" />
        </svg>
      );
    case 'space':
      return 'space';
    default:
      return isShift ? key.toUpperCase() : key;
  }
}
