import styles from '@/features/standings/components/PlayoffRacePanel.module.css';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import {
  derivePlayoffRace,
  PlayoffRaceGame,
  PlayoffRaceStatus,
} from '@/features/standings/utils/playoffRaceHelper';

interface PlayoffRacePanelProps {
  conference: string;
  standings: StandingsTeam[];
  games: PlayoffRaceGame[];
}

const STATUS_LABELS: Record<PlayoffRaceStatus, string> = {
  clinched: 'Simplified Clinched',
  'playoff-position': 'Playoff Position',
  chasing: 'Chasing',
  eliminated: 'Simplified Eliminated',
};

export default function PlayoffRacePanel({
  conference,
  standings,
  games,
}: PlayoffRacePanelProps) {
  const race = derivePlayoffRace(standings, games);

  return (
    <section className={styles.panel} aria-labelledby={`${conference}-race-heading`}>
      <div className={styles.headingRow}>
        <div>
          <h3 id={`${conference}-race-heading`}>{conference} Playoff Race</h3>
          <p className={styles.note}>
            Simplified Points-Only Math; NHL Tiebreakers Are Not Included.
          </p>
        </div>
        <span className={styles.cutline}>
          Cutline: {race.cutlinePoints === null ? '—' : `${race.cutlinePoints} Points`}
        </span>
      </div>
      {race.seasonOver && <p className={styles.seasonNote}>Regular Season Complete.</p>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="ds-visually-hidden">{conference} Simplified Playoff Race</caption>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Points</th>
              <th scope="col">Remaining</th>
              <th scope="col">Max Points</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {race.teams.map((entry) => {
              const pace = entry.requiredPace === null ? '—' : `${entry.requiredPace.toFixed(1)}/Game`;
              const raceValue =
                entry.status === 'chasing'
                    ? `Tragic Number ${entry.tragicNumber ?? '—'}`
                    : entry.status === 'playoff-position' || entry.status === 'clinched'
                    ? `Magic Number ${entry.magicNumber ?? '—'}`
                    : '—';
              return (
                <tr key={entry.team.id}>
                  <th scope="row">
                    <span className={styles.team}>
                      <img src={entry.team.teamLogo} alt="" />
                      {entry.team.teamName}
                    </span>
                  </th>
                  <td>{entry.team.points}</td>
                  <td>{entry.remainingGames}</td>
                  <td>{entry.maxPossiblePoints}</td>
                  <td>
                    <span className={`${styles.status} ${styles[entry.status]}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                    <span className={styles.raceValue}>
                      {raceValue}{entry.status === 'chasing' && entry.requiredPoints !== null ? ` · ${entry.requiredPoints} Needed (${pace})` : ''}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
