import { useState } from 'react';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import StatsLeaderModal from '@/features/stat-leaders/components/StatsLeaderModal';
import FavoriteCard from '@/components/FavoriteCard';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import {
  formatTeamAndPosition,
  getInitials,
} from '@/features/favorite-players/utils/playerCardFormat';
import styles from '@/features/stat-leaders/components/StatLeaderCard.module.css';

interface StatLeaderCardProps {
  topStatLeader: TopStatLeader;
}

/**
 * Favorite-style card for one stat category's top player: headshot with its
 * favorite star, category, value, name, and team and position. Pressing the
 * card opens a dialog with the full leaderboard; the star does not.
 */
export default function StatLeaderCard({ topStatLeader }: StatLeaderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { player } = topStatLeader;
  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <>
      <FavoriteCard
        fillWidth
        picture={
          <PlayerHeadshot
            playerId={player.id}
            playerName={fullName}
            src={player.playerImage}
            starSize="sm"
            className={styles.avatar}
            imgClassName={styles.avatarImg}
            fallback={
              <span className={styles.avatarInitials} aria-hidden="true">
                {getInitials(fullName)}
              </span>
            }
          />
        }
        stat={{
          label: topStatLeader.statIndicator,
          value: player.statLeaderValue,
        }}
        name={fullName}
        detail={formatTeamAndPosition({
          teamTriCode: player.teamAbbrev,
          position: player.position,
        })}
        onSelect={() => setShowModal(true)}
      />
      <StatsLeaderModal
        showModal={showModal}
        setShowStatsModal={setShowModal}
        statsLeaderData={topStatLeader.statLeadersList}
        modalTitle={topStatLeader.statIndicator}
      />
    </>
  );
}
