export function createSessionStorage(platform, secureStore, asyncStorage) {
  const web = platform === 'web';
  return {
    getItem: (key) => web ? asyncStorage.getItem(key) : secureStore.getItemAsync(key),
    setItem: (key, value) => web
      ? asyncStorage.setItem(key, value)
      : secureStore.setItemAsync(key, value),
    removeItem: (key) => web ? asyncStorage.removeItem(key) : secureStore.deleteItemAsync(key),
  };
}
