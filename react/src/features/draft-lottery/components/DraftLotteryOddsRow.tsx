import styles from '@/styles/LandingPageRow.module.css';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import DraftLotteryOddsCard from '@/features/draft-lottery/components/DraftLotteryOddsCard';

interface LandingPageRowProps {
  title: string;
  data: StandingsTeam[];
}

export default function LandingPageRow({ title, data }: LandingPageRowProps) {
  if (data.length > 1) {
    const maxOdds = Math.max(...data.map((t) => t.draftLotteryOdds));
    return (
      <div className={styles['section-container']}>
        <div className={styles['landing-header']}>
            <h2>{title}</h2>
        </div>
        <div className={`${styles['odds-grid']} ds-grid`}>
          {data.slice(0, 16).map((team, index) => (
            <DraftLotteryOddsCard
              key={team.id}
              team={team}
              index={index}
              maxOdds={maxOdds}
            />
          ))}
        </div>
      </div>
    );
  }
  return <></>;
}
