export class StandingsTeam {
  public id: string;
  public teamLogo: string;
  public teamName: string;
  public conferenceName: string;
  public divisionName: string;
  public wins: number;
  public losses: number;
  public otLosses: number;
  public points: number;
  public pointsPercentage: number;
  public leagueStanding: number;
  public conferenceStandingsPlace: number;
  public divisionStandingsPlace: number;
  public wildCardRank: number;
  public clinchingIndicator: string;
  public draftLotteryOdds: number;
  public draftLotteryOddsTrend: string;

  constructor(
    id: string,
    teamLogo: string,
    teamName: string,
    conferenceName: string,
    divisionName: string,
    wins: number,
    losses: number,
    otLosses: number,
    points: number,
    pointsPercentage: number,
    leagueStanding: number,
    conferenceStandingsPlace: number,
    divisionStandingsPlace: number,
    wildCardRank: number,
    clinchingIndicator: string,
    draftLotteryOdds: number,
    draftLotteryOddsTrend: string,
  ) {
    this.id = id;
    this.teamLogo = teamLogo;
    this.teamName = teamName;
    this.conferenceName = conferenceName;
    this.divisionName = divisionName;
    this.wins = wins;
    this.losses = losses;
    this.otLosses = otLosses;
    this.points = points;
    this.pointsPercentage = pointsPercentage;
    this.leagueStanding = leagueStanding;
    this.conferenceStandingsPlace = conferenceStandingsPlace;
    this.divisionStandingsPlace = divisionStandingsPlace;
    this.wildCardRank = wildCardRank;
    this.clinchingIndicator = clinchingIndicator;
    this.draftLotteryOdds = draftLotteryOdds;
    this.draftLotteryOddsTrend = draftLotteryOddsTrend;
  }
}
