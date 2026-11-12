const profiles = new Map();

async function findProfile(profileId) {
  return profiles.get(profileId) || null;
}

async function findCandidates(profileId) {
  return [...profiles.values()].filter((profile) => profile.id !== profileId);
}

async function saveProfile(profile) {
  profiles.set(profile.id, { ...profile });
  return profiles.get(profile.id);
}

module.exports = {
  findProfile,
  findCandidates,
  saveProfile,
};
