import { PlayerStatLeader } from "./PlayerStatLeader";

export class TopStatLeader{
    public statIndicator:string;
    public player:PlayerStatLeader;

    public constructor(statIndicator:string, player:PlayerStatLeader){
        this.statIndicator = statIndicator;
        this.player = player;
    }
}