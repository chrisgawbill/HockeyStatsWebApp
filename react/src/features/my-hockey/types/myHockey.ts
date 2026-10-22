import type { FanTier } from '@/lib/favoriteCategory';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';

/** One game from a team's schedule, corrected by its box score when rechecked. */
export interface FeedGame {
  gameId: number;
  /** Start time, ISO UTC. */
  startTime: string;
  gameState: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  /** REG / OT / SO: the current period type while live, the last one once final. */
  periodType: string | null;
  /** Current period number while live, from the box score. */
  period: number | null;
}

/** A skater's or goalie's line in one game's box score. */
export type PlayerGameLine =
  | { type: 'skater'; goals: number; assists: number }
  | { type: 'goalie'; saves: number; decision: string | null };

/** The parts of a game's box score the feed reads. */
export interface FeedBoxscore {
  game: FeedGame;
  /** Every player who dressed, by player id. */
  playerLines: Map<number, PlayerGameLine>;
}

export type SeasonTotals =
  | {
      type: 'skater';
      gamesPlayed: number;
      goals: number;
      assists: number;
      points: number;
    }
  | {
      type: 'goalie';
      gamesPlayed: number;
      wins: number;
      losses: number;
      /** Missing from an API that predates overtime losses in the summary. */
      otLosses: number | null;
      savePct: number | null;
      goalsAgainstAverage: number | null;
    };

/** Everything fetched for the feed; sections are built from it per render. */
export interface MyHockeyData {
  /** Games by team tri-code, by start time; a failed schedule leaves its team out. */
  gamesByTeam: Map<string, FeedGame[]>;
  boxscoresByGameId: Map<number, FeedBoxscore>;
  seasonTotalsByPlayerId: Map<number, SeasonTotals>;
}

/** A favorite team the feed follows, in tier order. */
export interface FeedTeam {
  triCode: string;
  tier: FanTier;
  label: string | null;
}

/** A game row; `team` is the favorite the row is told from. */
export interface FeedGameItem {
  game: FeedGame;
  team: FeedTeam;
}

export interface FeedPlayerItem {
  player: FavoritePlayer;
  seasonTotals: SeasonTotals | null;
  /** The player's team's latest live or final game, when known. */
  latestGame: {
    game: FeedGame;
    /** Null when the player did not dress for it. */
    line: PlayerGameLine | null;
  } | null;
}

export interface MyHockeyFeed {
  upNext: FeedGameItem[];
  lastResults: FeedGameItem[];
  players: FeedPlayerItem[];
}
