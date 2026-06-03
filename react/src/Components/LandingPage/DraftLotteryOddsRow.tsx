import { Col, Row } from 'react-bootstrap';
import styles from '../../style/LandingPage/LandingPageRow.module.css';
import React from 'react';
import { StandingsTeam } from '../../Data/Models/standingsTeam';
import DraftLotteryOddsCard from './DraftLotteryOddsCard';

interface LandingPageRowProps {
  title: string;
  data: StandingsTeam[];
}

export default function LandingPageRow({ title, data }: LandingPageRowProps) {
  if (data.length > 1) {
    const maxOdds = Math.max(...data.map((t) => t.draftLotteryOdds));
    return (
      <div className={styles['section-container']}>
        <Row>
          <Col className={styles['landing-header']}>
            <h2>{title}</h2>
          </Col>
        </Row>
        <Row>
          <Col xs={6}>
            {data.slice(0, 8).map((team, index) => (
              <DraftLotteryOddsCard
                key={team.id}
                team={team}
                index={index}
                maxOdds={maxOdds}
              />
            ))}
          </Col>
          <Col xs={6}>
            {data.slice(8).map((team, index) => (
              <DraftLotteryOddsCard
                key={team.id}
                team={team}
                index={index + 8}
                maxOdds={maxOdds}
              />
            ))}
          </Col>
        </Row>
      </div>
    );
  }
  return <></>;
}
