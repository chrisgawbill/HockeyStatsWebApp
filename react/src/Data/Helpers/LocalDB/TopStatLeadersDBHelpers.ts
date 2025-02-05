import { TopStatLeader } from "../../Models/TopStatLeader";
import { cachedAPIDBPromise } from "./ChachedAPIDB";

async function storeTopStatLeader(player:TopStatLeader):Promise<void>{
    try{
        const db = await cachedAPIDBPromise;
        let transaction:IDBTransaction = db.transaction(["topStatLeaderStore"], "readwrite");
        let topStatLeaderStore:IDBObjectStore = transaction.objectStore("topStatLeaderStore");
    
        let request:IDBRequest<IDBValidKey> = topStatLeaderStore.add(player);
        return new Promise<void>((resolve, reject) => {
            request.onsuccess = function(event:Event){
                console.log("Top goal leader has been added to the store", (event.target as IDBRequest<IDBValidKey>).result);
                resolve();
            }
            request.onerror = function(event:Event){
                console.error("Error adding top stat leader to the store", (event.target as IDBRequest).error?.message);
                reject((event.target as IDBRequest).error);
            }
        });
    }catch(error){
        console.error("Failed to connect to the database", error);
        return Promise.reject(error);
    }
}
async function getTopStatLeader(statIndicator:string):Promise<TopStatLeader>{
    try{
        const db = await cachedAPIDBPromise;
        let transaction:  IDBTransaction = db.transaction(["topStatLeaderStore"]);
        let topStatLeaderStore:IDBObjectStore = transaction.objectStore("topStatLeaderStore")

        let request:IDBRequest<TopStatLeader> = topStatLeaderStore.get(statIndicator);
        return new Promise<TopStatLeader>((resolve, reject) => {
            request.onsuccess = function(event:Event){
                let skaterTopStatLeader:TopStatLeader | undefined = (event.target as IDBRequest<TopStatLeader>).result;
                resolve(skaterTopStatLeader);
            }
            request.onerror = function(event:Event){
                console.error("Error retrieving top stat leader: ", (event.target as IDBRequest).error?.message);
                reject((event.target as IDBRequest).error);
            }
        })
    }catch(error){
        console.error("Failed to connect to the database: ",  error);
        return Promise.reject(error);
    }
}

export {storeTopStatLeader, getTopStatLeader};