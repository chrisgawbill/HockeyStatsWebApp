import { useState, type ReactNode } from 'react';
import FavoritePlayerStar from '@/features/favorite-players/components/FavoritePlayerStar';
import styles from '@/features/favorite-players/components/PlayerHeadshot.module.css';

export interface PlayerHeadshotProps {
  playerId: number;
  playerName: string;
  src?: string | null;
  /** Alt text for the photo; '' when the name is printed next to it. */
  alt?: string;
  /** Classes for the frame (size/shape) and the image itself. */
  className?: string;
  /** Optional clipping circle around the photo, inside the frame, so the
   * corner star is not clipped with it. */
  innerClassName?: string;
  imgClassName?: string;
  /** Shown instead of the photo when it is missing or fails to load. */
  fallback?: ReactNode;
  starSize?: 'sm' | 'md';
}

/**
 * A player's headshot with a corner star that favorites the player for the
 * Weekly Player Report. The star is its own button, so tapping the photo keeps
 * whatever the surrounding row or card already does.
 */
export default function PlayerHeadshot({
  playerId,
  playerName,
  src,
  alt = '',
  className,
  innerClassName,
  imgClassName,
  fallback = null,
  starSize = 'md',
}: PlayerHeadshotProps) {
  // Remember which URL failed so a changed headshot gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = Boolean(src) && failedSrc !== src;
  const photo = showPhoto ? (
    <img
      className={imgClassName}
      src={src ?? undefined}
      alt={alt}
      onError={() => setFailedSrc(src ?? null)}
    />
  ) : (
    fallback
  );

  return (
    <span className={[styles.frame, className].filter(Boolean).join(' ')}>
      {innerClassName ? <span className={innerClassName}>{photo}</span> : photo}
      <FavoritePlayerStar
        playerId={playerId}
        playerName={playerName}
        size={starSize}
        className={styles.corner}
      />
    </span>
  );
}
