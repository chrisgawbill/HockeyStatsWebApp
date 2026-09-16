import styles from '@/features/standings/components/LandingPageStandings.module.css';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import LandingPageStandingsTable from '@/features/standings/components/LandingPageStandingsTable';

interface StandingsContainerProps {
  standingsName: string;
  standingsData: StandingsTeam[];
  standingFormat: string;
}

export default function StandingsContainer({
  standingsName,
  standingsData,
  standingFormat,
}: StandingsContainerProps) {
  if (standingsData.length > 1) {
    return (
      <div>
        {standingsName && (
          <div className={styles['standings-header']}>
              <div>
                <h3>{standingsName}</h3>
              </div>
          </div>
        )}
        <div>
          <LandingPageStandingsTable
            standingsData={standingsData}
            standingFormat={standingFormat}
          />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
}
