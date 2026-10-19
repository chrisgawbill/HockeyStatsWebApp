import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import styles from '@/components/GoogleAvatarBadge.module.css';

export interface GoogleAvatarBadgeProps {
  email: string;
  /** Avatar picture URL decoded from the Google credential; falls back to an initial letter. */
  picture: string | null;
  onSignOut: () => void;
}

/**
 * Small circular sign-in status badge for the global nav bar (rendered by
 * `PageHeader`'s account corner on every page). Stays visible while
 * signed in; hovering (or clicking, for touch/keyboard) opens a small menu
 * with the "Sign out" action, rather than signing out on a plain click.
 */
export default function GoogleAvatarBadge({
  email,
  picture,
  onSignOut,
}: GoogleAvatarBadgeProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initial = email.charAt(0).toUpperCase();

  // Touch has no hover to leave, so a tap outside closes the menu.
  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(e: globalThis.PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  // Hover opens the menu for a mouse only: a tap fires enter and then click,
  // and the click's toggle would immediately close what the enter opened.
  function handlePointerHover(e: PointerEvent<HTMLDivElement>, next: boolean) {
    if (e.pointerType === 'mouse') setOpen(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onPointerEnter={(e) => handlePointerHover(e, true)}
      onPointerLeave={(e) => handlePointerHover(e, false)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.badge}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Signed in as ${email}`}
      >
        {picture ? (
          <img
            src={picture}
            alt=""
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.initial} aria-hidden="true">
            {initial}
          </span>
        )}
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <p className={styles.dropdownEmail}>{email}</p>
          <button
            type="button"
            role="menuitem"
            className={styles.dropdownItem}
            onClick={() => {
              onSignOut();
              setOpen(false);
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
