import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import { getInitials } from '@/features/favorite-players/utils/playerCardFormat';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';
import { getSeasonHeadshotUrl } from '@/lib/playerHeadshot';
import { formatPlayerTeamLine } from '@/features/player-compare/utils/playerLabels';
import { getGroupNoun } from '@/features/player-compare/utils/compareStats';
import type {
  ComparePlayer,
  CompareSlot,
} from '@/features/player-compare/types/playerCompare';
import styles from '@/features/player-compare/components/CompareTable.module.css';

interface CompareSlotHeaderProps {
  slot: CompareSlot;
  season: string;
  onRemove: (playerId: number) => void;
}

/** Headshot (with favorite star), name and team line for a compared player. */
function PlayerIdentity({
  player,
  season,
}: {
  player: ComparePlayer;
  season: string;
}) {
  const headshotUrl = player.teamTriCode
    ? getSeasonHeadshotUrl(season, player.teamTriCode, player.playerId)
    : null;
  return (
    <>
      <PlayerHeadshot
        playerId={player.playerId}
        playerName={player.name}
        src={headshotUrl}
        starSize="sm"
        className={styles.headshot}
        innerClassName={styles.headshotCircle}
        imgClassName={styles.headshotImage}
        fallback={
          <span className={styles.headshotInitials} aria-hidden="true">
            {getInitials(player.name)}
          </span>
        }
      />
      <span className={styles.playerName}>{player.name}</span>
      <span className={styles.playerTeam}>{formatPlayerTeamLine(player)}</span>
    </>
  );
}

/**
 * The column header for one slot: the player, or a message for an id with no
 * season line or a player from the other group, each with a Remove button.
 */
export default function CompareSlotHeader({
  slot,
  season,
  onRemove,
}: CompareSlotHeaderProps) {
  const playerId =
    slot.kind === 'unknown' ? slot.playerId : slot.player.playerId;
  const removeLabel =
    slot.kind === 'unknown' ? `player ${slot.playerId}` : slot.player.name;

  return (
    <div className={styles.slotHeader}>
      {slot.kind === 'unknown' ? (
        <span className={styles.slotMessage}>
          No {formatSeasonLabel(season)} stats for player {slot.playerId}
        </span>
      ) : (
        <PlayerIdentity player={slot.player} season={season} />
      )}
      {slot.kind === 'otherGroup' && (
        <span className={styles.slotMessage}>
          Compare {getGroupNoun(slot.player.group)} separately
        </span>
      )}
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove ${removeLabel}`}
        onClick={() => onRemove(playerId)}
      >
        Remove
      </button>
    </div>
  );
}
