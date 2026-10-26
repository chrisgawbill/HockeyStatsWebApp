import shared from '@/styles/shared.module.css';
import styles from '@/components/TeamFormPanel.module.css';
import FormStrip from '@/components/FormStrip';
import PointsPaceSparkline from '@/components/PointsPaceSparkline';
import SplitBars from '@/components/SplitBars';
import { joinClassNames } from '@/lib/joinClassNames';
import { TeamForm } from '@/lib/teamForm';

interface TeamFormPanelProps {
  teamForm: TeamForm;
  /** Unique per page, so several panels can sit on one page. */
  headingId?: string;
  /** The panel title's level; its subheadings sit one level below. */
  headingLevel?: 2 | 3 | 4;
  /** Page placement (margins, entry animation) for the outer surface. */
  className?: string;
}

/**
 * The "Team Form" panel: completed-game count and goal differential, the last
 * ten results, the rolling points-percentage sparkline, and the home/road
 * split bars.
 */
export default function TeamFormPanel({
  teamForm,
  headingId = 'team-form-heading',
  headingLevel = 2,
  className,
}: TeamFormPanelProps) {
  const Heading = `h${headingLevel}` as const;
  const Subheading = `h${headingLevel + 1}` as 'h3' | 'h4' | 'h5';

  return (
    <section
      className={joinClassNames(
        styles['form-panel'],
        shared.surface,
        className,
      )}
      aria-labelledby={headingId}
    >
      <div className={styles['form-panel__header']}>
        <div>
          <Heading id={headingId} className={shared.sectionTitle}>
            Team Form
          </Heading>
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
          <Subheading className={styles['form-panel__subheading']}>
            Rolling points percentage
          </Subheading>
          <PointsPaceSparkline values={teamForm.pace} />
        </div>
        <div>
          <Subheading className={styles['form-panel__subheading']}>
            Home / Road
          </Subheading>
          <SplitBars {...teamForm.splits} />
        </div>
      </div>
    </section>
  );
}
