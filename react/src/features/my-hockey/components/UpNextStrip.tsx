import SectionHeading from '@/components/SectionHeading';
import SignInButton from '@/components/SignInButton';
import { useAuth } from '@/lib/auth/AuthContext';
import { useFeedFavorites } from '@/features/my-hockey/hooks/useFeedFavorites';
import { useMyHockeyData } from '@/features/my-hockey/hooks/useMyHockeyData';
import {
  buildUpNext,
  correctGamesByTeam,
} from '@/features/my-hockey/utils/feedSelection';
import FeedList from '@/features/my-hockey/components/FeedList';
import UpNextRow from '@/features/my-hockey/components/UpNextRow';
import styles from '@/features/my-hockey/components/MyHockey.module.css';

/** Games the home strip shows before pointing to /my-hockey. */
const STRIP_GAME_COUNT = 3;

/** Home strip players: none, so it fetches team schedules only. */
const NO_PLAYERS: never[] = [];

/** Signed-out "Up next": what the strip would show, and a sign-in button. */
function UpNextSignInPrompt() {
  return (
    <section className={styles.strip} aria-labelledby="up-next-strip-title">
      <SectionHeading id="up-next-strip-title" title="Up next" />
      <div className={styles.signInPrompt}>
        <p className={styles.hint}>
          Sign in to follow your teams and see their next games here.
        </p>
        <SignInButton />
      </div>
    </section>
  );
}

/**
 * Home-page "Up next": the first three games of the user's favorite teams,
 * live first, with a link to the full My Hockey page. Signed out it shows a
 * sign-in prompt instead (not while a saved session is still being checked);
 * it renders nothing without favorite teams or with no games coming up.
 */
export default function UpNextStrip() {
  const { isSignedIn, teams } = useFeedFavorites();
  const { isRestoring } = useAuth();
  const dataLoad = useMyHockeyData(
    isSignedIn && teams.length > 0,
    teams.map((team) => team.triCode),
    NO_PLAYERS,
  );
  if (!isSignedIn) return isRestoring ? null : <UpNextSignInPrompt />;
  if (dataLoad.status !== 'ready') return null;

  const upNext = buildUpNext(
    teams,
    correctGamesByTeam(dataLoad.data),
    dataLoad.loadedAt,
  ).slice(0, STRIP_GAME_COUNT);
  if (upNext.length === 0) return null;

  const now = new Date(dataLoad.loadedAt);
  return (
    <section className={styles.strip} aria-labelledby="up-next-strip-title">
      <SectionHeading
        id="up-next-strip-title"
        title="Up next"
        link={{ label: 'My Hockey →', to: '/my-hockey' }}
      />
      <FeedList>
        {upNext.map((item) => (
          <UpNextRow
            key={item.game.gameId}
            item={item}
            now={now}
            showCategory={false}
          />
        ))}
      </FeedList>
    </section>
  );
}
