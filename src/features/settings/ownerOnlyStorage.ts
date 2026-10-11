type JsonStorage = {
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
};

export function createOwnerOnlyStorage(
  base: JsonStorage,
  isOwner: () => boolean,
): JsonStorage {
  return {
    setItem: (key: string, value: string) => {
      if (!isOwner()) return;
      base.setItem(key, value);
    },
    getItem: (key: string) => base.getItem(key),
    removeItem: (key: string) => {
      if (!isOwner()) return;
      base.removeItem(key);
    },
  };
}
