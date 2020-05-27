let dbPromise = idb.openDB('posts-store', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
        if(!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
        }
        console.log('db', db);
        console.log('oldVersion', oldVersion);
        console.log('newVersion', newVersion);
        console.log('transaction', transaction);
    }
});

function writeData(store, val) {
    return dbPromise.then(db => {
        return db.put(store, val)
    });
}

function readAllData(store) {
    return dbPromise.then(db => {
        return db.getAll(store)
    });
}

function clearAllData(store) {
    return dbPromise.then(db => {
        return db.clear(store);
    })
}