import { StandingsTeam } from "../../Models/StandingsTeam";
import { cachedAPIDBPromise } from "./ChachedAPIDB";

async function StoreLeagueStandings(leagueStandings: StandingsTeam[]):Promise<void> {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["leagueStandingsStore"],
      "readwrite"
    );
    let leagueStandingsStore: IDBObjectStore = transaction.objectStore(
      "leagueStandingsStore"
    );
      const promises = leagueStandings.map(team => {
        return new Promise<void>((resolve, reject) => {
            let request: IDBRequest<IDBValidKey> = leagueStandingsStore.add(team);
            request.onsuccess = function (event: Event) {
              console.log(
                "Team has been added to the store",
                (event.target as IDBRequest<IDBValidKey>).result
              );
              resolve();
            };
            request.onerror = function (event: Event) {
              console.error(
                "Error adding top team to the store",
                (event.target as IDBRequest).error?.message
              );
              reject((event.target as IDBRequest).error);
            };
          });
      });
      await Promise.all(promises);
      console.log("All teams have been added");
  } catch (error) {
    console.error("Failed to connect to the database", error);
    return Promise.reject(error);
  }
}
async function GetConferenceStandings(conferenceName: string) {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(["leagueStandingsStore"]);
    let leagueStandingsStore: IDBObjectStore = transaction.objectStore(
      "leagueStandingsStore"
    );

    let conferenceNameIndex = leagueStandingsStore.index("conference_place");
    let keyRange = IDBKeyRange.bound([conferenceName, 0], [conferenceName, Infinity]);
    let cursorRequest = conferenceNameIndex.openCursor(keyRange);
    let conferenceStandings:StandingsTeam[] = [];

    return new Promise<StandingsTeam[]>((resolve, reject) => {
      cursorRequest.onsuccess = (event) => {
        let cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
            conferenceStandings.push(cursor.value);
            cursor.continue();
        } else {
          resolve(conferenceStandings);
        }
      };
      cursorRequest.onerror = function (event: Event) {
        console.error(
          "Error retrieving top stat leader: ",
          (event.target as IDBRequest).error?.message
        );
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("Failed to connect to the database: ", error);
    return Promise.reject(error);
  }
}
async function GetDivisionStandings(divisionName: string) {
    try {
      const db = await cachedAPIDBPromise;
      let transaction: IDBTransaction = db.transaction(["leagueStandingsStore"]);
      let leagueStandingsStore: IDBObjectStore = transaction.objectStore(
        "leagueStandingsStore"
      );
  
      let divisionIndex = leagueStandingsStore.index("division_place");
      let keyRange = IDBKeyRange.bound([divisionName, 0], [divisionName, Infinity]);
      let cursorRequest = divisionIndex.openCursor(keyRange);
      let divisionStandings:StandingsTeam[] = [];

      return new Promise<StandingsTeam[]>((resolve, reject) => {
        cursorRequest.onsuccess = (event) => {
          let cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            divisionStandings.push(cursor.value);
            cursor.continue();
          } else {
            resolve(divisionStandings)
          }
        };
        cursorRequest.onerror = function (event: Event) {
          console.error(
            "Error retrieving division standings: ",
            (event.target as IDBRequest).error?.message
          );
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error("Failed to connect to the database: ", error);
      return Promise.reject(error);
    }
  }
  async function GetDraftLotteryOddsArray() {
    try {
      const db = await cachedAPIDBPromise;
      let transaction: IDBTransaction = db.transaction(["leagueStandingsStore"], "readonly");
      let leagueStandingsStore: IDBObjectStore = transaction.objectStore(
        "leagueStandingsStore"
      );
  
      let draftLotteryIndex = leagueStandingsStore.index("draftLotteryOdds");
      let cursorRequest = draftLotteryIndex.openCursor(null, "prev");
      let draftLotteryOdds:StandingsTeam[] = [];

      return new Promise<StandingsTeam[]>((resolve, reject) => {
        cursorRequest.onsuccess = (event) => {
          let cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && draftLotteryOdds.length < 16) {
            draftLotteryOdds.push(cursor.value);
            console.log(cursor.value);
            cursor.continue();
          } else {
            resolve(draftLotteryOdds)
          }
        };
        cursorRequest.onerror = function (event: Event) {
          console.error(
            "Error retrieving top stat leader: ",
            (event.target as IDBRequest).error?.message
          );
          reject((event.target as IDBRequest).error);
        };
      });
    } catch (error) {
      console.error("Failed to connect to the database: ", error);
      return Promise.reject(error);
    }
  }
  async function IsThereLeagueStandings():Promise<Boolean>{
    try{
        const db = await cachedAPIDBPromise;
        let transaction: IDBTransaction = db.transaction(["leagueStandingsStore"], "readonly");
        let leagueStandingsStore: IDBObjectStore = transaction.objectStore(
          "leagueStandingsStore"
        );
        const request = leagueStandingsStore.count();

        return new Promise<boolean>((resolve, reject) => {
            request.onsuccess = (event:Event) =>{
                const count:Number = (event.target as IDBRequest<number>).result;
                console.log(`Number of entries is ${count}`)
                resolve(count === 0);
            }
            request.onerror = (event:Event)=>{
                console.error("Error counting entries in the store: ", (event.target as IDBRequest).error?.message);
                reject((event.target as IDBRequest).error)
            }
        })
    }catch(error){
        console.error("Error connecting to the database: ", error);
        throw error;
    }
  }

export{StoreLeagueStandings, GetConferenceStandings, GetDivisionStandings, GetDraftLotteryOddsArray, IsThereLeagueStandings}
