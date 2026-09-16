import { get } from '@/lib/apiClient';

export interface ScheduleBroadcastDto {
  id: string;
  network: string;
  market: string;
  countryCode: string;
}

/** Normalized REST schedule row; feature utilities map `date` to a `Date`. */
export interface ScheduleGameDto {
  gameId: number;
  date: string;
  gameTime: string;
  dayOfWeek: string;
  venue: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number;
  broadcasts?: ScheduleBroadcastDto[];
  ticketLink: string;
  gameCenter: string;
  isPlayoff?: boolean;
  isPreseason?: boolean;
  playoffRound?: number | null;
  periodType?: string | null;
  seriesWins?: string | null;
  topSeedTeamAbbrev?: string | null;
  bottomSeedTeamAbbrev?: string | null;
  gameState: string;
}

export interface ScheduleResponseDto {
  games: ScheduleGameDto[];
}

/** Whole-season schedule (`GET /schedule/`), normalized backend contracts. */
export function GetScheduledGames(
  season?: string,
): Promise<ScheduleResponseDto> {
  return get<ScheduleResponseDto>('/schedule/', { season });
}
