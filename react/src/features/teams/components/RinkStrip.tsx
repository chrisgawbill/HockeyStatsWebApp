import React from 'react';

import JerseyToken from '@/features/teams/components/JerseyToken';
import { DisplayLine } from '@/features/teams/utils/teamLinesHelper';
import styles from '@/features/teams/components/RosterLines.module.css';

interface RinkStripProps {
  line: DisplayLine;
  caption: string;
  /** True once the strip is in view; triggers the line-change slide-in. */
  live: boolean;
}

/**
 * One line or pair drawn on a slice of ice: blue line, faceoff circle and
 * dots, with jersey tokens in formation (LW-C-RW, or LD-RD near the blue line).
 */
export default function RinkStrip({ line, caption, live }: RinkStripProps) {
  return (
    <figure className={styles.stripFigure}>
      <div className={`${styles.strip} ${live ? styles['strip--live'] : ''}`}>
        <span className={styles.strip__blueLine} aria-hidden="true" />
        <span className={styles.strip__circle} aria-hidden="true" />
        <span
          className={`${styles.strip__dot} ${styles['strip__dot--l']}`}
          aria-hidden="true"
        />
        <span
          className={`${styles.strip__dot} ${styles['strip__dot--r']}`}
          aria-hidden="true"
        />
        {line.tokens.map((token, i) => (
          <div
            key={token.player.id}
            className={`${styles.spot} ${styles[`spot--${token.slot}`]}`}
            style={{ '--i': i } as React.CSSProperties}
          >
            <JerseyToken player={token.player} slot={token.slot} />
          </div>
        ))}
      </div>
      <figcaption className={styles.stripCaption}>{caption}</figcaption>
    </figure>
  );
}
