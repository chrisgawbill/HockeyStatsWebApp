import { GameBroadcast } from "../Models/GameBroadcast";
import { ScheduledGame } from "../Models/ScheduledGame";

/**
 * The backend (api/services/mappers/scheduleMapper.js) now returns games already
 * normalized into the ScheduleGameContract shape, so the frontend only wraps each
 * contract in the ScheduledGame / GameBroadcast model classes the UI expects.
 * All NHL-field extraction + playoff logic now lives in the backend mapper.
 */

function ConvertContractToGame(g: any): ScheduledGame {
  const broadcasts: GameBroadcast[] = (g.broadcasts ?? []).map(
    (b: any) => new GameBroadcast(b.id, b.network, b.market, b.countryCode),
  );

  return new ScheduledGame(
    g.gameId,
    g.date,
    g.gameTime,
    g.dayOfWeek,
    g.venue,
    g.homeTeam,
    g.homeLogo,
    g.homeScore,
    g.awayTeam,
    g.awayLogo,
    g.awayScore,
    broadcasts,
    g.ticketLink,
    g.gameCenter,
    g.isPlayoff,
    g.playoffRound,
    g.periodType,
    g.seriesWins,
    g.topSeedTeamAbbrev,
    g.bottomSeedTeamAbbrev,
    g.gameState,
  );
}

export default function ConvertContractsToGames(games: any[]): ScheduledGame[] {
  return (games ?? []).map(ConvertContractToGame);
}
