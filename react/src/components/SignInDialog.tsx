import { useId, type CSSProperties } from 'react';
import AppDialog from '@/components/AppDialog';
import DiscordSignInButton from '@/components/DiscordSignInButton';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useAuth } from '@/lib/auth/AuthContext';
import { listSignInProviders } from '@/lib/auth/signInProviders';
import styles from '@/components/SignInDialog.module.css';

/** Shared width of the provider buttons, so Google's and Discord's line up. */
const PROVIDER_BUTTON_WIDTH = 240;

/** Hands the shared width to the CSS-sized buttons (Discord's). */
const providerButtonWidthStyle = {
  '--sign-in-button-width': `${PROVIDER_BUTTON_WIDTH}px`,
} as CSSProperties;

export interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The site-wide sign-in dialog: one button per provider this build offers
 * (Google, Discord). Google signs in in place; Discord leaves for Discord and
 * finishes when the user comes back.
 */
export default function SignInDialog({ open, onClose }: SignInDialogProps) {
  const auth = useAuth();
  const titleId = useId();
  const providers = listSignInProviders();

  const signInWithGoogle = (credential: string) => {
    auth.signIn(credential);
    onClose();
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className={styles.dialog}
    >
      <header className={styles.header}>
        <h2 id={titleId}>Sign in</h2>
      </header>
      <div className={styles.body}>
        {providers.length > 0 ? (
          <>
            <p className={styles.intro}>
              Keep your favorite teams and players, reports and Rink Quest
              streak on every device.
            </p>
            <div className={styles.providers} style={providerButtonWidthStyle}>
              {providers.includes('google') && (
                <GoogleSignInButton
                  onCredential={signInWithGoogle}
                  width={PROVIDER_BUTTON_WIDTH}
                />
              )}
              {providers.includes('discord') && (
                <DiscordSignInButton onClick={auth.signInWithDiscord} />
              )}
            </div>
          </>
        ) : (
          <p className={styles.intro}>Sign-in is unavailable right now.</p>
        )}
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={`ds-button ${styles.close}`}
          onClick={onClose}
        >
          Close
        </button>
      </footer>
    </AppDialog>
  );
}
