import styles from '@/features/standings/components/LandingPageStandings.module.css';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import LandingPageStandingsTable from '@/features/standings/components/LandingPageStandingsTable';

interface StandingsContainerProps {
  standingsName: string;
  standingsData: StandingsTeam[];
  standingFormat: string;
  fill?: boolean;
}

export default function StandingsContainer({
  standingsName,
  standingsData,
  standingFormat,
  fill = false,
}: StandingsContainerProps) {
  if (standingsData.length > 1) {
    return (
      <div className={fill ? styles['standings-container--fill'] : undefined}>
        {standingsName && (
          <div className={styles['standings-header']}>
              <div>
                <h3>{standingsName}</h3>
              </div>
          </div>
        )}
        <div
          className={
            fill ? styles['standings-container__table--fill'] : undefined
          }
        >
          <LandingPageStandingsTable
            standingsData={standingsData}
            standingFormat={standingFormat}
            fill={fill}
          />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
}
