import { TeamStats } from "./teamStats";

export class Team{
    public id:number;
    public teamName:string;
    public seasonStats:TeamStats[];



    constructor(id:number, teamName:string, seasonStats: TeamStats[],){
        this.id = id;
        this.teamName = teamName;
        this.seasonStats = seasonStats;
    }
}