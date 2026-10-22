import { useAuth } from '@/lib/auth/AuthContext';
import GoogleAvatarBadge from '@/components/GoogleAvatarBadge';
import SignInIconButton from '@/components/SignInIconButton';
import NotificationBell from '@/features/after-action-reports/components/NotificationBell';
import styles from '@/components/AccountCorner.module.css';

/**
 * Site-wide account controls for the global header: the sign-in icon (Google
 * or Discord in a dialog) when signed out; the After Action Report bell and avatar menu when signed in.
 */
export default function AccountCorner() {
  const auth = useAuth();

  if (!auth.email) {
    return <SignInIconButton />;
  }

  return (
    <div className={styles.corner}>
      <NotificationBell />
      <GoogleAvatarBadge
        email={auth.email}
        picture={auth.picture}
        onSignOut={auth.signOut}
      />
    </div>
  );
}
