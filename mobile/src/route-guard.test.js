const assert = require('node:assert/strict');
const test = require('node:test');

test('route guard waits for profile check before routing a new session', async () => {
  const { getAuthRedirect } = await import('./route-guard.js');
  assert.equal(getAuthRedirect({ token: 'token', section: '(auth)', profileChecked: false }), null);
  assert.equal(getAuthRedirect({ token: 'token', section: '(auth)', profileChecked: true, profileLoaded: true, profile: { preferences: null } }), '/onboarding');
});

test('route guard sends a signed-in user to tabs when profile lookup fails', async () => {
  const { getAuthRedirect } = await import('./route-guard.js');
  assert.equal(getAuthRedirect({
    token: 'token', section: '(auth)', profileChecked: true, profileLoaded: false,
  }), '/(tabs)');
});

test('route guard protects signed-out routes and redirects completed onboarding', async () => {
  const { getAuthRedirect } = await import('./route-guard.js');
  assert.equal(getAuthRedirect({ token: null, section: '(tabs)' }), '/(auth)/login');
  assert.equal(getAuthRedirect({
    token: 'token', section: 'onboarding', profileChecked: true, profileLoaded: true,
    profile: { preferences: { id: 'user-1' } },
  }), '/(tabs)');
});
