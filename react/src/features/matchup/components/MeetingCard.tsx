import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import shared from '@/styles/shared.module.css';
import styles from '@/features/matchup/components/MatchupPage.module.css';

interface MeetingCardProps {
  game: ScheduledGame;
  teamA: string;
  teamB: string;
  isPlayed: boolean;
}

/** One meeting between the two teams: date, who hosted, and the score or "Upcoming". */
export default function MeetingCard({
  game,
  teamA,
  teamB,
  isPlayed,
}: MeetingCardProps) {
  const teamAScore = game.homeTeam === teamA ? game.homeScore : game.awayScore;
  const teamBScore = game.homeTeam === teamB ? game.homeScore : game.awayScore;
  return (
    <article className={`${shared.surface} ${styles.meeting}`}>
      <span className={styles.date}>{game.date.toLocaleDateString()}</span>
      <span>
        {game.awayTeam} at {game.homeTeam}
      </span>
      <span className={styles.score}>
        {isPlayed ? `${teamAScore} – ${teamBScore}` : 'Upcoming'}
      </span>
    </article>
  );
}
