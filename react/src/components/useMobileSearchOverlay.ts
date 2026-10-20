import { KeyboardEvent, useEffect, useRef, useState } from 'react';

/**
 * State and accessibility behavior for the mobile-only full-screen search
 * overlay, opened from the floating action button below 576px. Kept entirely
 * separate from the desktop dropdown's open state so the two surfaces never
 * fight over the same open/close flag.
 *
 * While open it locks background scroll (restoring the previous value in the
 * effect cleanup, so a route change or unmount can never leave scrolling
 * locked), moves focus into the search input, and returns focus to the FAB
 * once it closes. `handleKeyDown` closes on Escape and traps Tab inside the
 * overlay.
 */
export function useMobileSearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    return () => {
      fabRef.current?.focus();
    };
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return { isOpen, open, close, fabRef, inputRef, handleKeyDown };
}
