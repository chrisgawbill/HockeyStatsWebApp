import PlayerCard from '@/features/teams/components/PlayerCard';
import RosterLineRow from '@/features/teams/components/RosterLineRow';
import {
  buildDefensePairs,
  buildForwardLines,
} from '@/features/teams/utils/teamPageHelper';
import {
  Position,
  RosterLine,
  RosterPlayer,
} from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface Props {
  roster: Record<Position, RosterPlayer[]>;
}

/** Splits a group's lines into the labeled ones (rendered as line rows) and any unlabeled overflow (rendered as a flat card grid). */
function splitLabeled(lines: RosterLine[]) {
  return {
    labeled: lines.filter((l) => l.label),
    overflow: lines.filter((l) => !l.label).flatMap((l) => l.players),
  };
}

/**
 * Roster tab: Forwards render as ice-time-ranked "lines" and Defense as
 * "pairs" (see `buildForwardLines`/`buildDefensePairs` — zips each
 * TOI-sorted position array together, so line/pair 1 is the most-used
 * players at each spot), each line rendered as one lifted `RosterLineRow`.
 * Any players beyond the numbered lines/pairs fall back to the flat
 * `PlayerCard` grid, as do Goalies (never enough of them to need pairing).
 * `RosterSection` (the old 5-column layout) is intentionally not used here —
 * it stays available for wherever it's already wired up, unmodified.
 */
export default function RosterTab({ roster }: Props) {
  const forwardLines = splitLabeled(buildForwardLines(roster));
  const defensePairs = splitLabeled(buildDefensePairs(roster));

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Roster</h2>

      <div className={styles['roster-group-section']}>
        <h3 className={styles['roster-group-section__header']}>Forwards</h3>
        <div className={styles['roster-line-list']}>
          {forwardLines.labeled.map((line) => (
            <RosterLineRow key={line.label} line={line} />
          ))}
        </div>
        {forwardLines.overflow.length > 0 && (
          <div className={styles['roster-group-cards']}>
            {forwardLines.overflow.map((player) => (
              <PlayerCard key={`${player.id}-${player.name}`} player={player} />
            ))}
          </div>
        )}
      </div>

      <div className={styles['roster-group-section']}>
        <h3 className={styles['roster-group-section__header']}>Defense</h3>
        <div className={styles['roster-line-list']}>
          {defensePairs.labeled.map((line) => (
            <RosterLineRow key={line.label} line={line} />
          ))}
        </div>
        {defensePairs.overflow.length > 0 && (
          <div className={styles['roster-group-cards']}>
            {defensePairs.overflow.map((player) => (
              <PlayerCard key={`${player.id}-${player.name}`} player={player} />
            ))}
          </div>
        )}
      </div>

      <div className={styles['roster-group-section']}>
        <h3 className={styles['roster-group-section__header']}>Goalies</h3>
        <div className={styles['roster-group-cards']}>
          {roster.Goalie.map((player) => (
            <PlayerCard key={`${player.id}-${player.name}`} player={player} />
          ))}
        </div>
      </div>
    </section>
  );
}
