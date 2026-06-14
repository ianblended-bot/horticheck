import { openDB } from 'idb';

const DB_NAME = 'horticheck';
const DB_VERSION = 1;
const STORE_NAME = 'records';
const KEY = 'all';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Load all saved QA records from IndexedDB.
 * Returns null if nothing has been saved yet (so the caller can fall back
 * to seed/sample data on first run).
 */
export async function loadRecords() {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, KEY);
    return data ?? null;
  } catch (err) {
    console.error('Failed to load records from IndexedDB', err);
    return null;
  }
}

/**
 * Persist the full records array to IndexedDB.
 * Photos (data URLs) are stored as part of the record objects, which
 * IndexedDB handles natively without the size limits of localStorage.
 */
export async function saveRecords(records) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, records, KEY);
  } catch (err) {
    console.error('Failed to save records to IndexedDB', err);
  }
}

/**
 * Clear all saved data (useful for "reset app" type actions).
 */
export async function clearRecords() {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, KEY);
  } catch (err) {
    console.error('Failed to clear records from IndexedDB', err);
  }
}
