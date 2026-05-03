import { GameBroadcast } from "../Models/GameBroadcast";
import { ScheduledGame } from "../Models/ScheduledGame";

export default function ConvertWeekToGames(week: any) {
  const games = week.games;
  const date = week.date;
  const dayOfWeek = week.dayAbbrev;

  let localListOfGames: ScheduledGame[] = [];

  for (let i = 0; i < games.length; i++) {
    const gameState = games[i].gameState;

    const gameId = games[i].id;
    const gameTime = games[i].startTimeUTC;
    const venue = games[i].venue.default;
    const homeTeam = games[i].homeTeam.abbrev;
    const homeLogo = games[i].homeTeam.logo;
    const homeScore = games[i].homeTeam.score;
    const awayTeam = games[i].awayTeam.abbrev;
    const awayLogo = games[i].awayTeam.logo;
    const awayScore = games[i].awayTeam.score;
    const broadcasts = ConvertToListOfBroadcasts(games[i].tvBroadcasts);
    let ticketLink = "";
    if (gameState === "FUT") {
      ticketLink = games[i].ticketsLink;
    }
    const gameCenter = games[i].gameCenterLink;
    const isPlayoff = games[i].gameType === 3;
    const playoffRound: number | null = (() => {
      if (!isPlayoff) return null;
      if (games[i].seriesStatus?.round != null)
        return games[i].seriesStatus.round;
      const idStr = String(games[i].id ?? "");
      return idStr.length === 10 ? parseInt(idStr.slice(6, 8)) || null : null;
    })();
    const periodType: string | null =
      games[i].periodDescriptor?.periodType ?? null;
    const seriesWins: string | null = (() => {
      if (!isPlayoff) return null;
      const top = games[i].seriesStatus?.topSeedWins;
      const bot = games[i].seriesStatus?.bottomSeedWins;
      return top != null && bot != null ? `${top}-${bot}` : null;
    })();

    const game: ScheduledGame = new ScheduledGame(
      gameId,
      date,
      gameTime,
      dayOfWeek,
      venue,
      homeTeam,
      homeLogo,
      homeScore,
      awayTeam,
      awayLogo,
      awayScore,
      broadcasts,
      ticketLink,
      gameCenter,
      isPlayoff,
      playoffRound,
      periodType,
      seriesWins,
    );
    localListOfGames.push(game);
  }
  return localListOfGames;
}
function ConvertToListOfBroadcasts(broadcasts: any) {
  let localListOfBroadcasts: GameBroadcast[] = [];
  for (let i = 0; i < broadcasts.length; i++) {
    const id = broadcasts[i].id;
    const broadcastName = broadcasts[i].network;
    const market = broadcasts[i].market;
    const broadcastCountry = broadcasts[i].countryCode;

    const broadcast: GameBroadcast = new GameBroadcast(
      id,
      broadcastName,
      market,
      broadcastCountry,
    );
    localListOfBroadcasts.push(broadcast);
  }
  return localListOfBroadcasts;
}
