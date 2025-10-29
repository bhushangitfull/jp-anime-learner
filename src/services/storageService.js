const DB_NAME = 'animePlayerDB';
const DB_VERSION = 1;
const STORES = {
  DICTIONARY: 'dictionary',
  RECENT_VIDEOS: 'recentVideos',
  RECENT_SUBTITLES: 'recentSubtitles'
};

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Dictionary store
      if (!db.objectStoreNames.contains(STORES.DICTIONARY)) {
        db.createObjectStore(STORES.DICTIONARY, { keyPath: 'id' });
      }

      // Recent videos store
      if (!db.objectStoreNames.contains(STORES.RECENT_VIDEOS)) {
        const videoStore = db.createObjectStore(STORES.RECENT_VIDEOS, { keyPath: 'id', autoIncrement: true });
        videoStore.createIndex('timestamp', 'timestamp');
      }

      // Recent subtitles store
      if (!db.objectStoreNames.contains(STORES.RECENT_SUBTITLES)) {
        const subtitleStore = db.createObjectStore(STORES.RECENT_SUBTITLES, { keyPath: 'id', autoIncrement: true });
        subtitleStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
};

export const storeDictionaryData = async (data) => {
  const tx = db.transaction(STORES.DICTIONARY, 'readwrite');
  const store = tx.objectStore(STORES.DICTIONARY);

  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getDictionaryData = async () => {
  const tx = db.transaction(STORES.DICTIONARY, 'readonly');
  const store = tx.objectStore(STORES.DICTIONARY);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storeRecentVideo = async (videoData) => {
  const tx = db.transaction(STORES.RECENT_VIDEOS, 'readwrite');
  const store = tx.objectStore(STORES.RECENT_VIDEOS);

  const data = {
    ...videoData,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getRecentVideos = async (limit = 10) => {
  const tx = db.transaction(STORES.RECENT_VIDEOS, 'readonly');
  const store = tx.objectStore(STORES.RECENT_VIDEOS);
  const index = store.index('timestamp');

  return new Promise((resolve, reject) => {
    const request = index.getAll(null, limit);
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const storeRecentSubtitle = async (subtitleData) => {
  const tx = db.transaction(STORES.RECENT_SUBTITLES, 'readwrite');
  const store = tx.objectStore(STORES.RECENT_SUBTITLES);

  const data = {
    ...subtitleData,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getRecentSubtitles = async (limit = 10) => {
  const tx = db.transaction(STORES.RECENT_SUBTITLES, 'readonly');
  const store = tx.objectStore(STORES.RECENT_SUBTITLES);
  const index = store.index('timestamp');

  return new Promise((resolve, reject) => {
    const request = index.getAll(null, limit);
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};