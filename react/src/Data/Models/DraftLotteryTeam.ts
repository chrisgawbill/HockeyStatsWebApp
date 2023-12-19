export class DraftLotteryTeam{
    constructor(public id:number, public teamName:string, public info:string, public image:string, public typeOfDate:string, public dataId:number, public rowId:string, public draftLotteryOdds:string, public draftLotteryOddsTrend:string){
        this.id = id;
        this.teamName = teamName;
        this.info = info;
        this.image = image;
        this.typeOfDate = typeOfDate;
        this.dataId = dataId;
        this.rowId = rowId;
        this.draftLotteryOdds = draftLotteryOdds;
        this.draftLotteryOddsTrend = draftLotteryOddsTrend;
    }
}