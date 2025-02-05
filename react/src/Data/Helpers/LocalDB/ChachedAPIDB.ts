let db:IDBDatabase;

const cachedAPIDBPromise:Promise<IDBDatabase> = new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest = indexedDB.open("cachedAPIDatabse", 1);

    request.onupgradeneeded = function(event:IDBVersionChangeEvent){
        db = (event.target as IDBOpenDBRequest).result;

        if(!db.objectStoreNames.contains("topStatLeaderStore")){
            db.createObjectStore("topStatLeaderStore", {keyPath:"statIndicator"});
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