import { useEffect, useCallback } from 'react';

/**
 * Configuration for a keyboard shortcut.
 */
export interface KeyboardShortcut {
  /** The key to listen for (e.g., 's', 'z', 'Escape', 'k') */
  key: string;
  /** Whether Ctrl (or Cmd on Mac) must be pressed */
  ctrl?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Whether Alt must be pressed */
  alt?: boolean;
  /** The action to execute when the shortcut is triggered */
  action: () => void;
}

/**
 * A custom React hook that registers global keyboard shortcuts.
 *
 * Listens for keydown events on the document and triggers the associated
 * action when a matching key combination is detected. Automatically
 * prevents default browser behavior for registered shortcuts and cleans
 * up event listeners on unmount.
 *
 * @param shortcuts - An array of shortcut configurations to register.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 's', ctrl: true, action: () => save() },
 *   { key: 'Escape', action: () => cancel() },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, ctrl = false, shift = false, alt = false, action } = shortcut;

        const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
        const isCtrlMatch = ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const isShiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const isAltMatch = alt ? event.altKey : !event.altKey;

        if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch) {
          event.preventDefault();
          action();
          break;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [handler]);
}

/**
 * A convenience hook that registers a Ctrl+S (or Cmd+S on Mac) shortcut
 * to trigger a save action.
 *
 * @param onSave - The callback to execute when Ctrl+S is pressed.
 *
 * @example
 * ```tsx
 * useSaveShortcut(() => {
 *   // save logic
 * });
 * ```
 */
export function useSaveShortcut(onSave: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [onSave]);
}

/**
 * A convenience hook that registers an Escape key shortcut to trigger
 * a cancel action.
 *
 * @param onCancel - The callback to execute when Escape is pressed.
 *
 * @example
 * ```tsx
 * useCancelShortcut(() => {
 *   // cancel logic
 * });
 * ```
 */
export function useCancelShortcut(onCancel: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [onCancel]);
}
