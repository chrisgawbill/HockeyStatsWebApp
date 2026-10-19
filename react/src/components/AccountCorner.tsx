import { useAuth } from '@/lib/auth/AuthContext';
import GoogleAvatarBadge from '@/components/GoogleAvatarBadge';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import NotificationBell from '@/features/after-action-reports/components/NotificationBell';
import styles from '@/components/AccountCorner.module.css';

/**
 * Site-wide account controls for the global header: Google sign-in when
 * signed out; the After Action Report bell and avatar menu when signed in.
 */
export default function AccountCorner() {
  const auth = useAuth();

  if (!auth.email) {
    return <GoogleSignInButton onCredential={auth.signIn} size="small" />;
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
