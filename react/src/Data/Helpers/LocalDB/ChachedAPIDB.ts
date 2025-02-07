let db:IDBDatabase;

const cachedAPIDBPromise:Promise<IDBDatabase> = new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest = indexedDB.open("cachedAPIDatabse", 8);

    request.onupgradeneeded = function(event:IDBVersionChangeEvent){
        db = (event.target as IDBOpenDBRequest).result;
  
        if(!db.objectStoreNames.contains("topStatLeaderStore")){
            db.createObjectStore("topStatLeaderStore", {keyPath:"statIndicator"});
        }
        if(!db.objectStoreNames.contains("leagueStandingsStore")){
            const leagueStandingsStore = db.createObjectStore("leagueStandingsStore", {keyPath:"id"});
            leagueStandingsStore.createIndex("teamName", "teamName", {unique:true});
            leagueStandingsStore.createIndex("conferenceName", "conferenceName", {unique:false});
            leagueStandingsStore.createIndex("divisionName", "divisionName", {unique:false});
            leagueStandingsStore.createIndex("points", "points", {unique:false});
            leagueStandingsStore.createIndex("leagueStanding", "leagueStanding", {unique:false});
            leagueStandingsStore.createIndex("conferenceStandingsPlace", "conferenceStandingsPlace", {unique:false});
            leagueStandingsStore.createIndex("divisionStandingsPlace", "divisionStandingsPlace", {unique:false});
            leagueStandingsStore.createIndex("wildCardRank", "wildCardRank", {unique:false});
            leagueStandingsStore.createIndex("draftLotteryOdds", "draftLotteryOdds", {unique:false});

            leagueStandingsStore.createIndex("conference_place", ["conferenceName", "conferenceStandingsPlace"], {unique:false});
            leagueStandingsStore.createIndex("division_place", ["divisionName", "divisionStandingsPlace"], {unique:false});
        }
    };
    request.onsuccess = function(event:Event){
        db = (event.target as IDBOpenDBRequest).result;
        console.log("Database connection established"); 
        resolve(db);
    };
    request.onerror = function(event:Event){
        console.error("Database error: " + (event.target as IDBOpenDBRequest).error?.message);
        reject((event.target as IDBOpenDBRequest).error);
    };
});

export { cachedAPIDBPromise };