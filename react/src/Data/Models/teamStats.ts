export class TeamStats {
  public seasonId: number;
  public wins: number;
  public regulationWins: number;
  public otWins: number;
  public losses: number;
  public otLosses: number;
  public points: number;
  public faceoffWinPct: number;
  public goalsAgainst: number;
  public goalsAgainstPerGame: number;
  public goalsFor: number;
  public goalsPerGame: number;
  public penaltyKillPct: number;
  public powerPlayPct: number;
  public shotsAgainstPerGame: number;
  public shotsForPerGame: number;

  constructor(
    seasonId: number,
    wins: number,
    regulationWins: number,
    otWins: number,
    losses: number,
    otLosses: number,
    points: number,
    faceoffWinPct: number,
    goalsAgainst: number,
    goalsAgainstPerGame: number,
    goalsFor: number,
    goalsPerGame: number,
    penaltyKillPct: number,
    powerPlayPct: number,
    shotsAgainstPerGame: number,
    shotsForPerGame: number,
  ) {
    this.seasonId = seasonId;
    this.wins = wins;
    this.regulationWins = regulationWins;
    this.otWins = otWins;
    this.losses = losses;
    this.otLosses = otLosses;
    this.points = points;
    this.faceoffWinPct = faceoffWinPct;
    this.goalsAgainst = goalsAgainst;
    this.goalsAgainstPerGame = goalsAgainstPerGame;
    this.goalsFor = goalsFor;
    this.goalsPerGame = goalsPerGame;
    this.penaltyKillPct = penaltyKillPct;
    this.powerPlayPct = powerPlayPct;
    this.shotsAgainstPerGame = shotsAgainstPerGame;
    this.shotsForPerGame = shotsForPerGame;
  }
}
