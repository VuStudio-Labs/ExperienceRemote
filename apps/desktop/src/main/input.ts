import { mouse, keyboard, Button, Key, Point } from '@nut-tree-fork/nut-js';

// Configure nut.js for smoother movement
mouse.config.autoDelayMs = 0;
mouse.config.mouseSpeed = 2000;

export class InputController {
  private accumulatedX = 0;
  private accumulatedY = 0;

  async moveMouse(dx: number, dy: number): Promise<void> {
    try {
      // Accumulate sub-pixel movements
      this.accumulatedX += dx;
      this.accumulatedY += dy;

      // Only move if we have at least 1 pixel of movement
      const moveX = Math.trunc(this.accumulatedX);
      const moveY = Math.trunc(this.accumulatedY);

      if (moveX !== 0 || moveY !== 0) {
        const currentPos = await mouse.getPosition();
        const newPos = new Point(currentPos.x + moveX, currentPos.y + moveY);
        await mouse.setPosition(newPos);

        // Keep the fractional part for next movement
        this.accumulatedX -= moveX;
        this.accumulatedY -= moveY;
      }
    } catch (err) {
      console.error('Mouse move error:', err);
    }
  }

  async click(button: 'left' | 'right' | 'middle'): Promise<void> {
    try {
      const btn = this.getButton(button);
      await mouse.click(btn);
    } catch (err) {
      console.error('Click error:', err);
    }
  }

  async mouseDown(button: 'left' | 'right' | 'middle'): Promise<void> {
    try {
      const btn = this.getButton(button);
      await mouse.pressButton(btn);
    } catch (err) {
      console.error('Mouse down error:', err);
    }
  }

  async mouseUp(button: 'left' | 'right' | 'middle'): Promise<void> {
    try {
      const btn = this.getButton(button);
      await mouse.releaseButton(btn);
    } catch (err) {
      console.error('Mouse up error:', err);
    }
  }

  async scroll(dx: number, dy: number): Promise<void> {
    try {
      // nut.js scroll works with pixel amounts
      if (Math.abs(dy) > Math.abs(dx)) {
        await mouse.scrollDown(Math.round(dy));
      } else if (dx !== 0) {
        // Horizontal scroll is less common, using left/right
        // Note: nut.js may not support horizontal scroll directly
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  async pressKey(key: string): Promise<void> {
    try {
      const nutKey = this.mapKey(key);
      if (nutKey) {
        await keyboard.pressKey(nutKey);
        await keyboard.releaseKey(nutKey);
      }
    } catch (err) {
      console.error('Key press error:', err);
    }
  }

  async typeText(text: string): Promise<void> {
    try {
      await keyboard.type(text);
    } catch (err) {
      console.error('Type text error:', err);
    }
  }

  async navigate(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    try {
      const keyMap: Record<string, Key> = {
        up: Key.Up,
        down: Key.Down,
        left: Key.Left,
        right: Key.Right,
      };
      const key = keyMap[direction];
      if (key) {
        await keyboard.pressKey(key);
        await keyboard.releaseKey(key);
      }
    } catch (err) {
      console.error('Navigate error:', err);
    }
  }

  private getButton(button: 'left' | 'right' | 'middle'): Button {
    switch (button) {
      case 'left':
        return Button.LEFT;
      case 'right':
        return Button.RIGHT;
      case 'middle':
        return Button.MIDDLE;
      default:
        return Button.LEFT;
    }
  }

  private mapKey(key: string): Key | null {
    // Map common keys
    const keyMap: Record<string, Key> = {
      Enter: Key.Enter,
      Backspace: Key.Backspace,
      Tab: Key.Tab,
      Escape: Key.Escape,
      Space: Key.Space,
      ' ': Key.Space,
      ArrowUp: Key.Up,
      ArrowDown: Key.Down,
      ArrowLeft: Key.Left,
      ArrowRight: Key.Right,
    };

    if (keyMap[key]) {
      return keyMap[key];
    }

    // For single characters, use the Key enum if available
    if (key.length === 1) {
      const upperKey = key.toUpperCase();
      if (upperKey >= 'A' && upperKey <= 'Z') {
        return (Key as any)[upperKey];
      }
      if (upperKey >= '0' && upperKey <= '9') {
        return (Key as any)[`Num${upperKey}`] || (Key as any)[upperKey];
      }
    }

    return null;
  }
}
