export class PlayerStatLeader{
    public id:number;
    public firstName:string;
    public lastName:string;
    public sweaterNumber:number;
    public playerImage:string;
    public teamAbbrev:string;
    public teamName:string;
    public teamLogo:string;
    public position:string;
    public value:number;

    public constructor(id:number, firstName:string, lastName:string, sweaterNumber:number, playerImage:string, teamAbbrev:string, teamName:string, teamLogo:string, position:string, value:number){
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.sweaterNumber = sweaterNumber;
        this.playerImage = playerImage;
        this.teamAbbrev = teamAbbrev;
        this.teamName = teamName;
        this.teamLogo = teamLogo;
        this.position = position;
        this.value = (Math.ceil(value*100))/100;
    }
}