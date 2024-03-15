import { PlayerStatLeader } from "../Models/PlayerStatLeader";

export default function PlayerStatLeaderConverter(playerLeaderResponseData:any, leadBy:string){
    let localPlayerResponseData:any[] = [];
    switch(leadBy){
        case "goals":
            localPlayerResponseData = playerLeaderResponseData.goals;
            break;
        case "assists":
            localPlayerResponseData = playerLeaderResponseData.assists;
            break;
        case "points":
            localPlayerResponseData = playerLeaderResponseData.points;
            break;
        case "wins":
            localPlayerResponseData = playerLeaderResponseData.wins;
            break;
        case "savePctg":
            localPlayerResponseData = playerLeaderResponseData.savePctg;
            break;
        case "goalsAgainstAverage":
            localPlayerResponseData = playerLeaderResponseData.goalsAgainstAverage;
            break;
        case "shutouts":
            localPlayerResponseData = playerLeaderResponseData.shutouts;
            break;
        default:
            break;
    }
    let playerStatLeaderArray:PlayerStatLeader[] = new Array(10);
    for(let i = 0; i < localPlayerResponseData.length; i++){
        const id:number = localPlayerResponseData[i].id;
        const firstName:string = localPlayerResponseData[i].firstName.default;
        const lastName:string = localPlayerResponseData[i].lastName.default;
        const sweaterNumber = localPlayerResponseData[i].sweaterNumber;
        const playerImage = localPlayerResponseData[i].headshot;
        const teamAbbrev = localPlayerResponseData[i].teamAbbrev;
        const teamName = localPlayerResponseData[i].teamName.default;
        const teamLogo = localPlayerResponseData[i].teamLogo;
        const position = localPlayerResponseData[i].position;
        const value = localPlayerResponseData[i].value;

        const playerStatLeader:PlayerStatLeader = new PlayerStatLeader(id, firstName, lastName, sweaterNumber, playerImage, teamAbbrev, teamName, teamLogo, position, value);
        playerStatLeaderArray[i] = playerStatLeader;
    }
    return playerStatLeaderArray;
}