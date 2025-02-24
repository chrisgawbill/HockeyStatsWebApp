import { ScheduledGame } from "../../Models/ScheduledGame";
import { cachedAPIDBPromise } from "./ChachedAPIDB";

async function StoreScheduledGames(
  scheduledGames: ScheduledGame[]
): Promise<void> {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["scheduledGameStore"],
      "readwrite"
    );
    let scheduledGameStore: IDBObjectStore =
      transaction.objectStore("scheduledGameStore");
    const promises = scheduledGames.map((game) => {
      return new Promise<void>((resolve, reject) => {
        let request: IDBRequest<IDBValidKey> = scheduledGameStore.add(game);
        request.onsuccess = function (event: Event) {
          console.log(
            "Game has been added to the store",
            (event.target as IDBRequest<IDBValidKey>).result
          );
          resolve();
        };
        request.onerror = function (event: Event) {
          console.error(
            "Error adding game to the store",
            (event.target as IDBRequest).error?.message
          );
          reject((event.target as IDBRequest).error);
        };
      });
    });
    await Promise.all(promises);
    console.log("All games have been added");
  } catch (error) {
    console.error("Failed to connect to the database", error);
    return Promise.reject(error);
  }
}
async function GetGameFromDay(dayOfWeek: string) {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["scheduledGameStore"],
      "readonly"
    );
    let scheduledGameStore: IDBObjectStore =
      transaction.objectStore("scheduledGameStore");

    let dayOfWeekIndex = scheduledGameStore.index("dayOfWeek");
    let keyRange = IDBKeyRange.bound([dayOfWeek, 0], [dayOfWeek, Infinity]);
    let cursorRequest = dayOfWeekIndex.openCursor(keyRange);
    let games: ScheduledGame[] = [];

    return new Promise<ScheduledGame[]>((resolve, reject) => {
      cursorRequest.onsuccess = (event) => {
        let cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          games.push(cursor.value);
          cursor.continue();
        } else {
          resolve(games);
        }
      };
      cursorRequest.onerror = function (event: Event) {
        console.error(
          "Error retrieving games: ",
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
async function GetAllGames() {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["scheduledGameStore"],
      "readonly"
    );
    let scheduledGameStore: IDBObjectStore =
      transaction.objectStore("scheduledGameStore");

    let games: ScheduledGame[] = [];

    let request: IDBRequest<ScheduledGame[]> = scheduledGameStore.getAll();
    return new Promise<ScheduledGame[]>((resolve, reject) => {
      request.onsuccess = function (event: Event) {
        games.push((event.target as IDBRequest<ScheduledGame>).result);
        resolve(games);
      };
      request.onerror = function (event: Event) {
        console.error(
          "Error retrieving scheduled games: ",
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
async function UpdateGameDB(game:ScheduledGame){
  try{
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["scheduledGameStore"],
      "readwrite"
    );
    let scheduledGameStore: IDBObjectStore =
      transaction.objectStore("scheduledGameStore");
    let request: IDBRequest<IDBValidKey> = scheduledGameStore.get(game.gameId);
    request.onsuccess = function(event:Event){
      let gameToUpdate = (event.target as IDBRequest).result;
      if(gameToUpdate){
        let updateRequest:IDBRequest<IDBValidKey> = scheduledGameStore.put(game);
        updateRequest.onsuccess = function(event:Event){
          console.log("Game has been updated: ", (event.target as IDBRequest<IDBValidKey>).result);
        }
        updateRequest.onerror = function(event:Event){
          console.error("Failed to update the game: ", (event.target as IDBRequest).error?.message);
        }
      }
    }
  }catch(error){
    console.error("Failed to update the game: ", error);
    return Promise.reject(error);
  }
}
async function IsThereGamesScheduled(): Promise<Boolean> {
  try {
    const db = await cachedAPIDBPromise;
    let transaction: IDBTransaction = db.transaction(
      ["scheduledGameStore"],
      "readonly"
    );
    let scheduledGameStore: IDBObjectStore =
      transaction.objectStore("scheduledGameStore");
    const request = scheduledGameStore.count();

    return new Promise<boolean>((resolve, reject) => {
      request.onsuccess = (event: Event) => {
        const count: Number = (event.target as IDBRequest<number>).result;
        resolve(count === 0);
      };
      request.onerror = (event: Event) => {
        console.error(
          "Error counting entries in the store: ",
          (event.target as IDBRequest).error?.message
        );
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("Error connecting to the database: ", error);
    throw error;
  }
}
export {
  StoreScheduledGames,
  GetGameFromDay,
  GetAllGames,
  UpdateGameDB,
  IsThereGamesScheduled,
};
