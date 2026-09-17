export interface GameBroadcast {
  id: string;
  broadcasterName: string;
  market: string;
  broadcastCountry: string;
}
export class GameBroadcast {
  id: string;
  broadcasterName: string;
  market: string;
  broadcastCountry: string;

  constructor(
    id: string,
    broadcasterName: string,
    market: string,
    broadcastCountry: string,
  ) {
    this.id = id;
    this.broadcasterName = broadcasterName;
    this.market = market;
    this.broadcastCountry = broadcastCountry;
  }
}
