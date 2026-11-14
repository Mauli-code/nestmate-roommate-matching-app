const assert = require('node:assert/strict');
const test = require('node:test');
const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const userRepository = require('./user-repository');
const profileRepository = require('../matching/profile-repository');
const { MatchingController } = require('../matching/matching.controller');
const { MatchingService } = require('../matching/matching.service');

test('register, login, save preferences, get profile and matches, then reject logged-out token', async () => {
  const users = new Map();
  const repository = {
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) || null,
    findById: async (id) => users.get(id) || null,
    save: async (user) => { users.set(user.id, user); return user; },
    isActive: userRepository.isActive,
  };
  const auth = new AuthService(repository);
  const matching = new MatchingService(profileRepository, null, null, repository);
  const authController = new AuthController(auth);
  const matchingController = new MatchingController(matching);

  await authController.register({ fullName: 'Flow User', email: 'flow@example.com', password: 'nestmate123' });
  const login = await authController.login({ email: 'flow@example.com', password: 'nestmate123' });
  const request = { user: auth.verifyToken(login.accessToken), authToken: login.accessToken };
  const preferences = {
    minBudget: '8000', maxBudget: '16000', preferredArea: 'Baner',
    sleepSchedule: 'flexible', foodHabits: 'vegetarian', cleanliness: 'medium',
    smoking: 'no', drinking: 'never', pets: 'any',
  };

  const saved = await matchingController.savePreferences(login.user.id, preferences, request);
  const profile = await authController.getProfile(request);
  const matches = await matchingController.getMatches(login.user.id, 1, 10, request);

  assert.equal(saved.profile.id, login.user.id);
  assert.equal(profile.preferences.preferredArea, 'Baner');
  assert.equal(matches.profileId, login.user.id);
  assert.deepEqual(matches.matches, []);
  assert.equal(await authController.logout(request).then((result) => result.message), 'Logged out successfully');
  assert.throws(() => auth.verifyToken(login.accessToken), /invalid/i);
});
