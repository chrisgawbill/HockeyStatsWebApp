import { useEffect, useRef, useState } from 'react';
import styles from '@/features/board-game/components/GoogleSignInButton.module.css';

/**
 * Minimal shape of the Google Identity Services global this component needs.
 * No @types package is installed for GSI; this covers only `initialize` and
 * `renderButton`, loaded via the script tag in index.html (BG-B23's Google
 * Fonts preconnect is the model for that tag).
 */
interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}
interface GoogleButtonConfiguration {
  type: 'standard';
  theme: 'outline' | 'filled_black';
  size: 'large';
  text: 'signin_with';
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
  /** Called with the Google ID token once the user completes sign-in. */
  onCredential: (credential: string) => void;
}

/** True once `window.google.accounts.id` is available (GSI script loaded). */
function isGoogleIdentityReady(): boolean {
  return typeof window !== 'undefined' && window.google?.accounts?.id != null;
}

/**
 * Google's branding rules give no API to trigger the "Sign in with Google"
 * credential flow from a custom button, and even their custom-button fallback
 * fixes the G logo, CTA text, and color/font/padding (see the BG-B31 ticket
 * for the research). So this renders Google's own button unmodified and frames
 * it in the game's pixel-art chrome instead of trying to reskin the button.
 */
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

/** Pixel-art-framed "Sign in with Google" button (BG-B31). */
export default function GoogleSignInButton({
  onCredential,
}: GoogleSignInButtonProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(isGoogleIdentityReady());

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

  useEffect(() => {
    if (ready || !clientId) return;
    // The GSI script tag in index.html loads async; poll briefly rather than
    // depending on a load-event listener, since the script may already be
    // cached/loaded before this effect runs.
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
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
      });
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
    }
  }, [ready, clientId, onCredential]);

  if (!clientId) {
    return (
      <div className={styles.frame}>
        <span className={styles.unavailable}>Sign-in unavailable</span>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <div ref={slotRef} className={styles.slot} />
    </div>
  );
}
