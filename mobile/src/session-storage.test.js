const assert = require('node:assert/strict');
const test = require('node:test');

test('session storage uses secure storage on native and async storage on web', async () => {
  const { createSessionStorage } = await import('./session-storage.js');
  const calls = [];
  const secure = {
    getItemAsync: async (...args) => { calls.push(['secure read', ...args]); return 'native-token'; },
    setItemAsync: async (...args) => calls.push(['secure write', ...args]),
    deleteItemAsync: async (...args) => calls.push(['secure delete', ...args]),
  };
  const web = {
    getItem: async (...args) => { calls.push(['web read', ...args]); return 'web-token'; },
    setItem: async (...args) => calls.push(['web write', ...args]),
    removeItem: async (...args) => calls.push(['web delete', ...args]),
  };
  const nativeStorage = createSessionStorage('ios', secure, web);
  const webStorage = createSessionStorage('web', secure, web);
  await nativeStorage.setItem('token', 'native-token');
  assert.equal(await nativeStorage.getItem('token'), 'native-token');
  await nativeStorage.removeItem('token');
  await webStorage.setItem('token', 'web-token');
  assert.equal(await webStorage.getItem('token'), 'web-token');
  await webStorage.removeItem('token');
  assert.deepEqual(calls.map((call) => call[0]), [
    'secure write', 'secure read', 'secure delete', 'web write', 'web read', 'web delete',
  ]);
});
