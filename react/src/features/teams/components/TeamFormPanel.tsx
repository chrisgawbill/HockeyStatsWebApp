import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';
import FormStrip from '@/features/teams/components/FormStrip';
import PointsPaceSparkline from '@/features/teams/components/PointsPaceSparkline';
import SplitBars from '@/features/teams/components/SplitBars';
import { TeamForm } from '@/features/teams/utils/teamFormHelper';

/**
 * The "Team Form" panel: completed-game count and goal differential, the last
 * ten results, the rolling points-percentage sparkline, and the home/road
 * split bars.
 */
export default function TeamFormPanel({ teamForm }: { teamForm: TeamForm }) {
  return (
    <section
      className={`${styles['form-panel']} ${shared.surface}`}
      aria-labelledby="team-form-heading"
    >
      <div className={styles['form-panel__header']}>
        <div>
          <h2 id="team-form-heading" className={shared.sectionTitle}>
            Team Form
          </h2>
          <p className={styles['form-panel__caption']}>
            {teamForm.results.length} completed games · goal differential{' '}
            {teamForm.goalDiff > 0 ? '+' : ''}
            {teamForm.goalDiff}
          </p>
        </div>
        <div className={styles['form-panel__recent']}>
          <span className={styles['form-panel__label']}>Last 10</span>
          <FormStrip results={teamForm.recent} />
        </div>
      </div>
      <div className={styles['form-panel__grid']}>
        <div>
          <h3 className={styles['form-panel__subheading']}>
            Rolling points percentage
          </h3>
          <PointsPaceSparkline values={teamForm.pace} />
        </div>
        <div>
          <h3 className={styles['form-panel__subheading']}>Home / Road</h3>
          <SplitBars {...teamForm.splits} />
        </div>
      </div>
    </section>
  );
}
