import { useMemo, useState } from 'react';
import TeamDna from '@/components/TeamDna';
import SlidingToggle from '@/components/SlidingToggle';
import { useListOfTeamsData } from '@/features/teams/hooks/ListOfTeamsContext';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { buildTeamDna, TeamDnaLeagueTeam, TeamDnaProfile } from '@/lib/teamDna';
import { getTeamAccentColor } from '@/lib/teamColor';
import { localTeamList } from '@/lib/teamListData';
import { useTheme } from '@/lib/ThemeContext';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useHorizontalSwipe } from '@/lib/useHorizontalSwipe';
import styles from '@/features/matchup/components/MatchupPage.module.css';

const PHONE_QUERY = '(max-width: 767px)';

type MatchupSide = 'teamA' | 'teamB';

interface MatchupTeamDnaProps {
  teamA: string;
  teamB: string;
}

/**
 * One team's Team DNA ranked against the already-loaded league team list,
 * matched by the club's full name and id; no team stats request is made.
 */
function buildMatchupTeamDna(
  triCode: string,
  league: TeamDnaLeagueTeam[],
  season: string,
): TeamDnaProfile {
  const localTeam = localTeamList.find((team) => team.triCode === triCode);
  return buildTeamDna({
    stats: { teamFullName: localTeam?.fullName ?? '' },
    league,
    season,
    teamId: localTeam?.id,
  });
}

/**
 * A Team DNA card for each side of the matchup, tinted in that team's color.
 * Wide screens show both side by side; phones show one at a time behind a
 * team switch that a horizontal swipe also flips. Hidden while the league
 * list loads, when it failed, or when neither team has season data.
 */
export default function MatchupTeamDna({ teamA, teamB }: MatchupTeamDnaProps) {
  const { listOfTeamsData, loadingListOfTeamsData, errorListOfTeamsData } =
    useListOfTeamsData();
  const { season } = useSeason();
  const { theme } = useTheme();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [phoneSide, setPhoneSide] = useState<MatchupSide>('teamA');
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => setPhoneSide('teamB'),
    onSwipeRight: () => setPhoneSide('teamA'),
  });

  const profiles = useMemo(
    () => ({
      teamA: buildMatchupTeamDna(teamA, listOfTeamsData, season),
      teamB: buildMatchupTeamDna(teamB, listOfTeamsData, season),
    }),
    [teamA, teamB, listOfTeamsData, season],
  );
  const triCodes: Record<MatchupSide, string> = { teamA, teamB };

  const hasAnyRows =
    profiles.teamA.rows.length > 0 || profiles.teamB.rows.length > 0;
  if (loadingListOfTeamsData || errorListOfTeamsData || !hasAnyRows)
    return null;

  const renderCard = (side: MatchupSide) => (
    <TeamDna
      key={side}
      profile={profiles[side]}
      season={season}
      title={`${triCodes[side]} Team DNA`}
      teamColor={getTeamAccentColor(triCodes[side], theme)}
    />
  );

  if (isPhone) {
    return (
      <section className={styles.dnaSection} aria-label="Team DNA">
        <SlidingToggle
          options={[
            { label: teamA, value: 'teamA' },
            { label: teamB, value: 'teamB' },
          ]}
          value={phoneSide}
          onChange={setPhoneSide}
        />
        <div className={styles.dnaSwipeArea} {...swipeHandlers}>
          {renderCard(phoneSide)}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${styles.dnaSection} ${styles.dnaGrid}`}
      aria-label="Team DNA"
    >
      {renderCard('teamA')}
      {renderCard('teamB')}
    </section>
  );
}
