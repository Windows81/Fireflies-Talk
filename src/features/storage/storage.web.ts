const inMemoryStorage: Record<string, string> = {};

const localStorageOrMemory = {
  setItem: (key: string, value: string) => {
    try {
      return window.localStorage.setItem(key, value);
    } catch {
      inMemoryStorage[key] = value;
    }
  },
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return inMemoryStorage[key] || null;
    }
  },
  removeItem: (key: string) => {
    try {
      return window.localStorage.removeItem(key);
    } catch {
      delete inMemoryStorage[key];
    }
  },
};

export default localStorageOrMemory;
