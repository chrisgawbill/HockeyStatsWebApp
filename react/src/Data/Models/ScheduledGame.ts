import { GameBroadcast } from "./GameBroadcast";

export interface IScheduledGame {
  gameId: number;
  date: Date;
  gameTime: string;
  dayOfWeek: string;
  venue: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number;
  broadcasts: GameBroadcast[];
  ticketLink: string;
  gameCenter: string;
  isPlayoff: boolean;
  playoffRound: number | null;
  periodType: string | null;
  seriesWins: string | null;
  topSeedTeamAbbrev: string| null;
  bottomSeedTeamAbbrev: string| null;
  gameState: string;
}
export class ScheduledGame implements IScheduledGame {
  gameId: number;
  date: Date;
  gameTime: string;
  dayOfWeek: string;
  venue: string;
  homeTeam: string;
  homeLogo: string;
  homeScore: number;
  awayTeam: string;
  awayLogo: string;
  awayScore: number;
  broadcasts: GameBroadcast[];
  ticketLink: string;
  gameCenter: string;
  isPlayoff: boolean;
  playoffRound: number | null;
  periodType: string | null;
  seriesWins: string | null;
  topSeedTeamAbbrev: string| null;
  bottomSeedTeamAbbrev: string| null;
  gameState: string;

  constructor(
    gameId: number,
    date: Date,
    gameTime: string,
    dayOfWeek: string,
    venue: string,
    homeTeam: string,
    homeLogo: string,
    homeScore: number,
    awayTeam: string,
    awayLogo: string,
    awayScore: number,
    broadcasts: GameBroadcast[],
    ticketLink: string,
    gameCenter: string,
    isPlayoff: boolean = false,
    playoffRound: number | null = null,
    periodType: string | null = null,
    seriesWins: string | null = null,
    topSeedTeamAbbrev: string| null,
    bottomSeedTeamAbbrev: string| null,
    gameState: string,
  ) {
    this.gameId = gameId;
    this.date = date;
    this.gameTime = gameTime;
    this.dayOfWeek = dayOfWeek;
    this.venue = venue;
    this.homeTeam = homeTeam;
    this.homeLogo = homeLogo;
    this.homeScore = homeScore;
    this.awayTeam = awayTeam;
    this.awayLogo = awayLogo;
    this.awayScore = awayScore;
    this.broadcasts = broadcasts;
    this.ticketLink = ticketLink;
    this.gameCenter = gameCenter;
    this.isPlayoff = isPlayoff;
    this.playoffRound = playoffRound;
    this.periodType = periodType;
    this.seriesWins = seriesWins;
    this.topSeedTeamAbbrev = topSeedTeamAbbrev;
    this.bottomSeedTeamAbbrev = bottomSeedTeamAbbrev;
    this.gameState = gameState;
  }
}
