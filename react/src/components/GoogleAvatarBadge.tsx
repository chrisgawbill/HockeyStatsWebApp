import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { Link } from 'react-router-dom';
import styles from '@/components/GoogleAvatarBadge.module.css';

/**
 * Closes the menu when a pointer goes down outside `wrapperRef`. Touch has no
 * hover to leave, so a tap outside is the only way a touch user dismisses it.
 */
function useCloseOnOutsidePointer(
  wrapperRef: RefObject<HTMLElement>,
  isOpen: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutsidePointer(event: globalThis.PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen, wrapperRef, close]);
}

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
 * with a My Hockey link and the "Sign out" action, rather than signing out
 * on a plain click.
 */
export default function GoogleAvatarBadge({
  email,
  picture,
  onSignOut,
}: GoogleAvatarBadgeProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initial = email.charAt(0).toUpperCase();

  const closeMenu = useCallback(() => setOpen(false), []);
  useCloseOnOutsidePointer(wrapperRef, open, closeMenu);

  // Hover opens the menu for a mouse only: a tap fires enter and then click,
  // and the click's toggle would immediately close what the enter opened.
  function handlePointerHover(
    event: PointerEvent<HTMLDivElement>,
    nextOpen: boolean,
  ) {
    if (event.pointerType === 'mouse') setOpen(nextOpen);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onPointerEnter={(event) => handlePointerHover(event, true)}
      onPointerLeave={(event) => handlePointerHover(event, false)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.badge}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
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
          <Link
            to="/my-hockey"
            role="menuitem"
            className={styles.dropdownItem}
            onClick={() => setOpen(false)}
          >
            My Hockey
          </Link>
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
