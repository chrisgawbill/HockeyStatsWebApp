import { PlayerStatLeader } from "./playerStatLeader";

export class TopStatLeader{
    public statIndicator:string;
    public player:PlayerStatLeader;
    public statLeadersList:PlayerStatLeader[];
    
    public constructor(statIndicator:string, player:PlayerStatLeader, statLeadersList:PlayerStatLeader[]){
        this.statIndicator = statIndicator;
        this.player = player;
        this.statLeadersList = statLeadersList;
    }
}