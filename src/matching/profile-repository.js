const { readStore, writeStore } = require('../store-file');
const profiles = new Map();
for (const profile of readStore().profiles || []) profiles.set(profile.id, profile);

async function findProfile(profileId) {
  return profiles.get(profileId) || null;
}

async function findCandidates(profileId) {
  return [...profiles.values()].filter((profile) => profile.id !== profileId);
}

async function saveProfile(profile) {
  profiles.set(profile.id, { ...profile });
  writeStore({
    users: readStore().users || [],
    profiles: [...profiles.values()],
  });
  return profiles.get(profile.id);
}

module.exports = {
  findProfile,
  findCandidates,
  saveProfile,
};
