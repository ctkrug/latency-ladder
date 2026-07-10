import { trimmedMean } from "../lib/stats";

const DB_NAME = "latency-ladder-scratch";
const STORE_NAME = "scratch";
const TRIALS = 20;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unsupported in this browser"));
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function get(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Round-trips a small payload through a real object store `TRIALS` times
 * and returns the raw per-trial read latencies in nanoseconds, before
 * outlier trimming. */
export async function sampleIndexedDb(): Promise<number[]> {
  const db = await openDb();
  const payload = { probe: true, at: 0 };

  try {
    // Warm the connection with an untimed round-trip first: opening/creating
    // the database is measurably slower than a subsequent get, and including
    // it would dominate the trimmed mean.
    await put(db, "warmup", payload);
    await get(db, "warmup");

    const samplesNs: number[] = [];
    for (let i = 0; i < TRIALS; i++) {
      const key = `probe-${i}`;
      await put(db, key, payload);

      const start = performance.now();
      await get(db, key);
      samplesNs.push((performance.now() - start) * 1_000_000);
    }
    return samplesNs;
  } finally {
    db.close();
  }
}

export async function benchmarkIndexedDb(): Promise<number> {
  return trimmedMean(await sampleIndexedDb());
}
