import { useEffect, useRef, useState } from 'react';
import styles from '@/components/GoogleSignInButton.module.css';

type GoogleButtonSize = 'large' | 'medium' | 'small';

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}
interface GoogleButtonConfiguration {
  type: 'standard';
  theme: 'outline' | 'filled_black';
  size: GoogleButtonSize;
  text: 'signin_with' | 'signin';
  shape: 'pill';
  logo_alignment: 'left';
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfiguration,
          ) => void;
        };
      };
    };
  }
}

export interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  /** Google's button size; `small` also shortens the label to "Sign in". */
  size?: GoogleButtonSize;
  /** Extra frame styling, e.g. Rink Quest's pixel border. */
  className?: string;
  unavailableClassName?: string;
}

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function isGoogleIdentityReady(): boolean {
  return typeof window !== 'undefined' && window.google?.accounts?.id != null;
}

function resolveGoogleButtonTheme(): 'outline' | 'filled_black' {
  if (typeof document === 'undefined') return 'outline';
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'dark') return 'filled_black';
  if (explicit === 'light') return 'outline';
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'filled_black' : 'outline';
}

/**
 * Renders Google's branded sign-in button (Google Identity Services). Used in
 * the global header and on Rink Quest; the credential goes to `useAuth().signIn`.
 */
export default function GoogleSignInButton({
  onCredential,
  size = 'large',
  className,
  unavailableClassName,
}: GoogleSignInButtonProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(isGoogleIdentityReady());

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (ready || !clientId) return;
    const interval = window.setInterval(() => {
      if (isGoogleIdentityReady()) {
        setReady(true);
        window.clearInterval(interval);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [ready, clientId]);

  useEffect(() => {
    if (!ready || !clientId || !slotRef.current) return;
    try {
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google!.accounts.id.renderButton(slotRef.current, {
        type: 'standard',
        theme: resolveGoogleButtonTheme(),
        size,
        text: size === 'small' ? 'signin' : 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
      });
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
    }
  }, [ready, clientId, onCredential, size]);

  if (!clientId) {
    return (
      <div className={cx(styles.frame, className)}>
        <span className={cx(styles.unavailable, unavailableClassName)}>
          Sign-in unavailable
        </span>
      </div>
    );
  }

  return (
    <div className={cx(styles.frame, className)}>
      <div ref={slotRef} className={styles.slot} />
    </div>
  );
}
