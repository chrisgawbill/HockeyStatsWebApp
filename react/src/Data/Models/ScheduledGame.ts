import { GameBroadcast } from './GameBroadcast';

export interface IScheduledGame {
    gameId: number;
    date: Date;
    gameTime: string;
    dayOfWeek: string;
    venue: string;
    homeTeam: string;
    homeLogo: string;
    homeScore:number;
    awayTeam: string;
    awayLogo: string;
    awayScore:number;
    broadcasts: GameBroadcast[];
    ticketLink: string;
    gameCenter: string;
}
export class ScheduledGame implements IScheduledGame {
    gameId: number;
    date: Date;
    gameTime: string;
    dayOfWeek: string;
    venue: string;
    homeTeam: string;
    homeLogo: string;
    homeScore:number;
    awayTeam: string;
    awayLogo: string;
    awayScore: number;
    broadcasts: GameBroadcast[];
    ticketLink: string;
    gameCenter: string;

    constructor(
        gameId: number,
        date: Date,
        gameTime: string,
        dayOfWeek: string,
        venue: string,
        homeTeam: string,
        homeLogo: string,
        homeScore:number,
        awayTeam: string,
        awayLogo: string,
        awayScore:number,
        broadcasts: GameBroadcast[],
        ticketLink: string,
        gameCenter: string
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
    }
}


