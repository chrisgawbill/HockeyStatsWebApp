import React from 'react';
import {
  BoxscoreSkater,
  BoxscoreGoalie,
  BoxscoreTeamStats,
} from '@/features/game-detail/types/gameDetail';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import FavoritePlayerStar from '@/features/favorite-players/components/FavoritePlayerStar';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

interface Props {
  homeTeam: BoxscoreTeamStats;
  awayTeam: BoxscoreTeamStats;
  homeAbbrev: string;
  awayAbbrev: string;
}

/** Converts an 'mm:ss' time on ice to seconds; 0 when it is missing (the AHL). */
function toSeconds(toi: string | null): number {
  if (!toi) return 0;
  const [m, s] = toi.split(':').map(Number);
  return m * 60 + (s || 0);
}

/** Save percentage with three decimals, or a dash when missing. */
function formatSvPct(pct?: number): string {
  if (pct == null) return '—';
  return (pct * 100).toFixed(1) + '%';
}

/** Name cell: the favorite star, then the player's name. */
function PlayerNameCell({
  playerId,
  name,
}: {
  playerId: number;
  name: string;
}) {
  return (
    <td className={styles['player-box-table__name-col']}>
      <span className={styles['player-box-table__player']}>
        <FavoritePlayerStar playerId={playerId} playerName={name} size="sm" />
        {name}
      </span>
    </td>
  );
}

/** Skater box score sorted by time on ice, or by points where TOI is not tracked. */
function SkaterTable({ skaters }: { skaters: BoxscoreSkater[] }) {
  const hasToi = skaters.some((skater) => skater.toi != null);
  const sorted = [...skaters].sort((a, b) =>
    hasToi ? toSeconds(b.toi) - toSeconds(a.toi) : b.points - a.points,
  );
  return (
    <div
      className={`${styles['player-box-table-wrapper']} ${shared.surface} ${shared.surfaceScroll}`}
    >
      <table className={styles['player-box-table']}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles['player-box-table__name-col']}>Name</th>
            <th>Pos</th>
            <th>G</th>
            <th>A</th>
            <th>P</th>
            <th>+/-</th>
            <th>PIM</th>
            <th>Hits</th>
            <th>Blk</th>
            <th>SOG</th>
            {hasToi && <th>TOI</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((skater) => (
            <tr key={skater.playerId}>
              <td className={styles['player-box-table__muted']}>
                {skater.sweaterNumber}
              </td>
              <PlayerNameCell
                playerId={skater.playerId}
                name={skater.name.default}
              />
              <td className={styles['player-box-table__muted']}>
                {skater.position}
              </td>
              <td>{skater.goals}</td>
              <td>{skater.assists}</td>
              <td
                className={
                  skater.points > 0 ? styles['player-box-table__highlight'] : ''
                }
              >
                {skater.points}
              </td>
              <td
                className={
                  skater.plusMinus > 0
                    ? styles['player-box-table__positive']
                    : skater.plusMinus < 0
                      ? styles['player-box-table__negative']
                      : ''
                }
              >
                {skater.plusMinus > 0
                  ? `+${skater.plusMinus}`
                  : skater.plusMinus}
              </td>
              <td>{skater.pim}</td>
              <td>{skater.hits}</td>
              <td>{skater.blockedShots}</td>
              <td>{skater.sog}</td>
              {hasToi && (
                <td className={styles['player-box-table__muted']}>
                  {skater.toi}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Box score for goalies who played: time on ice, or where that is not
 * tracked (the AHL), a decision or a shot faced.
 */
function GoalieTable({ goalies }: { goalies: BoxscoreGoalie[] }) {
  const hasToi = goalies.some((goalie) => goalie.toi != null);
  const played = goalies.filter((goalie) =>
    hasToi
      ? toSeconds(goalie.toi) > 0
      : Boolean(goalie.decision) || goalie.shotsAgainst > 0,
  );
  if (played.length === 0) return null;
  return (
    <div
      className={`${styles['player-box-table-wrapper']} ${shared.surface} ${shared.surfaceScroll}`}
    >
      <table className={styles['player-box-table']}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles['player-box-table__name-col']}>Name</th>
            <th>Dec</th>
            <th>SV/SA</th>
            <th>SV%</th>
            <th>GA</th>
            {hasToi && <th>TOI</th>}
          </tr>
        </thead>
        <tbody>
          {played.map((goalie) => (
            <tr key={goalie.playerId}>
              <td className={styles['player-box-table__muted']}>
                {goalie.sweaterNumber}
              </td>
              <PlayerNameCell
                playerId={goalie.playerId}
                name={goalie.name.default}
              />
              <td
                className={
                  goalie.decision === 'W'
                    ? styles['player-box-table__positive']
                    : goalie.decision === 'L'
                      ? styles['player-box-table__negative']
                      : styles['player-box-table__muted']
                }
              >
                {goalie.decision ?? '—'}
              </td>
              <td>
                {goalie.saveShotsAgainst ??
                  `${goalie.saves}/${goalie.shotsAgainst}`}
              </td>
              <td>{formatSvPct(goalie.savePctg)}</td>
              <td>{goalie.goalsAgainst}</td>
              {hasToi && (
                <td className={styles['player-box-table__muted']}>
                  {goalie.toi}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One team's skater and goalie tables. */
function TeamPlayerStats({
  team,
  abbrev,
}: {
  team: BoxscoreTeamStats;
  abbrev: string;
}) {
  const { league } = useLeague();
  const skaters = [...team.forwards, ...team.defense];
  const teamColor = getTeamPrimaryColor(abbrev, league);

  return (
    <div
      className={styles['player-stats-team-block']}
      style={{ '--player-team-color': teamColor } as React.CSSProperties}
    >
      <h3 className={styles['player-stats-team-block__title']}>{abbrev}</h3>
      <p className={styles['player-stats-team-block__subtitle']}>Skaters</p>
      <SkaterTable skaters={skaters} />
      <p className={styles['player-stats-team-block__subtitle']}>Goalies</p>
      <GoalieTable goalies={team.goalies} />
    </div>
  );
}

/** Player box scores with a toggle between the away and home team. */
function PlayerStatsSelection({
  homeTeam,
  awayTeam,
  homeAbbrev,
  awayAbbrev,
}: Props) {
  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Player Stats</h2>
      <TeamPlayerStats team={awayTeam} abbrev={awayAbbrev} />
      <TeamPlayerStats team={homeTeam} abbrev={homeAbbrev} />
    </section>
  );
}

export default PlayerStatsSelection;
