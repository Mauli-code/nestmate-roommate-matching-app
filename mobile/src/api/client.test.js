const assert = require('node:assert/strict');
const test = require('node:test');

test('request includes JSON and returns parsed data', async () => {
  const oldFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(url, /localhost:3000/);
    assert.equal(options.headers.Authorization, 'Bearer token');
    assert.deepEqual(JSON.parse(options.body), { city: 'Pune' });
    return { ok: true, json: async () => ({ saved: true }) };
  };
  try {
    const { request } = await import('./client.js');
    assert.deepEqual(await request('/test', { method: 'POST', token: 'token', body: { city: 'Pune' } }), { saved: true });
  } finally {
    global.fetch = oldFetch;
  }
});

test('request errors include status and field errors', async () => {
  const oldFetch = global.fetch;
  global.fetch = async () => ({
    ok: false, status: 400,
    json: async () => ({ message: 'Check your input', errors: { email: 'Enter a valid email.' } }),
  });
  try {
    const { request } = await import('./client.js');
    await assert.rejects(request('/test'), (error) => {
      assert.equal(error.message, 'Check your input');
      assert.equal(error.status, 400);
      assert.deepEqual(error.errors, { email: 'Enter a valid email.' });
      return true;
    });
  } finally {
    global.fetch = oldFetch;
  }
});

test('request gives a useful network error', async () => {
  const oldFetch = global.fetch;
  global.fetch = async () => { throw new Error('offline'); };
  try {
    const { request } = await import('./client.js');
    await assert.rejects(request('/test'), (error) => error.status === 0 && /backend could not be reached/.test(error.message));
  } finally {
    global.fetch = oldFetch;
  }
});
