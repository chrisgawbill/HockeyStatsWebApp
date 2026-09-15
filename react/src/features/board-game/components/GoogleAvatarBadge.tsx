import { useState, type KeyboardEvent } from 'react';
import styles from '@/features/board-game/components/GoogleAvatarBadge.module.css';

export interface GoogleAvatarBadgeProps {
  email: string;
  /** Avatar picture URL decoded from the Google credential; falls back to an initial letter. */
  picture: string | null;
  onSignOut: () => void;
}

/**
 * Small circular sign-in status badge for the global nav bar (rendered via
 * `PageHeader`'s `corner` slot from `BoardGamePage`). Stays visible while
 * signed in; hovering (or clicking, for touch/keyboard) opens a small menu
 * with the "Sign out" action, rather than signing out on a plain click.
 */
export default function GoogleAvatarBadge({
  email,
  picture,
  onSignOut,
}: GoogleAvatarBadgeProps) {
  const [open, setOpen] = useState(false);
  const initial = email.charAt(0).toUpperCase();

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
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
