export class StandingsTeam{
    constructor(public id:number, public teamName:string, public conferenceName:string, public divisionName:string, public wins:number, public losses:number, public otLosses:number, 
        public record:string, public points:number, public pointsPercentage:number, public leagueStanding:number, public conferenceStandingsPlace:number, public divisionStandingsPlace:number){
        this.id = id;
        this.teamName = teamName;
        this.conferenceName = conferenceName;
        this.divisionName = divisionName;
        this.wins = wins;
        this.losses = losses;
        this.otLosses = otLosses;
        this.record = record;
        this.points = points;
        this.pointsPercentage = pointsPercentage;
        this.leagueStanding = leagueStanding;
        this.conferenceStandingsPlace = conferenceStandingsPlace;
        this.divisionStandingsPlace = divisionStandingsPlace;
    }
}