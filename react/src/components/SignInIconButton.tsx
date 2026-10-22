import { useState } from 'react';
import SignInDialog from '@/components/SignInDialog';
import styles from '@/components/SignInIconButton.module.css';

/** A filled person figure: the signed-out account icon. */
function AccountIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4.5" />
      <path d="M3.5 21c0-4.4 3.8-7.5 8.5-7.5s8.5 3.1 8.5 7.5z" />
    </svg>
  );
}

/**
 * The signed-out account control in the global header: the bell's glass
 * circle with a person figure, opening the sign-in dialog.
 */
export default function SignInIconButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-label="Sign in"
        title="Sign in"
        aria-haspopup="dialog"
        onClick={() => setIsDialogOpen(true)}
      >
        <AccountIcon />
      </button>
      <SignInDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
