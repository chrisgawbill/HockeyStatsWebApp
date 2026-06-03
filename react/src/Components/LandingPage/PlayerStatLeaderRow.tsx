import { Col, Row } from 'react-bootstrap';
import styles from '../../style/LandingPage/LandingPageRow.module.css';
import React from 'react';
import { TopStatLeader } from '../../Data/Models/topStatLeader';
import StatLeaderCard from './StatLeaderCard';
import EmptyState from '../EmptyState';
import { useSeason } from '../../Data/Context/SeasonContext';
import { formatSeasonLabel } from '../../Data/Helpers/seasonHelper';

interface PlayerStatLeaderProps {
  title: string;
  topStatLeaders: (TopStatLeader | undefined)[];
}

/**
 * A titled, horizontally scrolling row of stat-leader cards. Drops categories
 * that haven't loaded (undefined) and falls back to an EmptyState, naming the
 * season, when none of them are available.
 */
export default function PlayerStatLeaderRow({
  title,
  topStatLeaders,
}: PlayerStatLeaderProps) {
  const { season } = useSeason();
  const availableLeaders = topStatLeaders.filter(
    (leader): leader is TopStatLeader => Boolean(leader),
  );

  return (
    <div>
      <Row>
        <Col className={styles['landing-header']}>
          <h2>{title}</h2>
        </Col>
      </Row>
      {availableLeaders.length < 1 ? (
        <EmptyState
          message={`No ${title.toLowerCase()} available for ${formatSeasonLabel(season)}.`}
        />
      ) : (
        <div className={styles['row-scroller-wrapper']}>
          <Row className={styles['row-scroller']}>
            {availableLeaders.map((topStatLeader: TopStatLeader) => (
              <Col
                sm
                md={5}
                lg={4}
                className={styles['row-scroller-column']}
                key={topStatLeader.statIndicator}
              >
                <StatLeaderCard topStatLeader={topStatLeader} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
