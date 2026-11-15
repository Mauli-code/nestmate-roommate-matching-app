const { readStore, writeStore } = require('../store-file');
const { isPostgres, query } = require('../database/connection');

// In-memory cache & fallback for STORAGE_MODE=memory
const profiles = new Map();
for (const profile of readStore().profiles || []) {
  profiles.set(profile.id, profile);
}

function mapPreferenceRow(row) {
  if (!row) return null;
  const minBudget = Number(row.min_budget);
  const maxBudget = Number(row.max_budget);
  return {
    id: row.user_id,
    budget: Math.round((minBudget + maxBudget) / 2),
    minBudget,
    maxBudget,
    moveInDate: '',
    preferredArea: row.preferred_area || '',
    lifestyle: {
      sleepSchedule: row.sleep_schedule,
      cleanliness: row.cleanliness,
      smoking: row.smoking === 'yes',
      pets: row.pets,
    },
    foodHabits: row.food_habits,
    drinking: row.drinking,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

async function findProfile(profileId) {
  if (isPostgres()) {
    const res = await query(
      'SELECT * FROM roommate_preferences WHERE user_id = $1 LIMIT 1;',
      [profileId]
    );
    return mapPreferenceRow(res.rows[0]);
  }

  return profiles.get(profileId) || null;
}

async function findCandidates(profileId) {
  if (isPostgres()) {
    const res = await query(
      'SELECT * FROM roommate_preferences WHERE user_id <> $1 ORDER BY created_at DESC;',
      [profileId]
    );
    return res.rows.map(mapPreferenceRow);
  }

  return [...profiles.values()].filter((profile) => profile.id !== profileId);
}

async function saveProfile(profile) {
  if (isPostgres()) {
    const minBudget =
      profile.minBudget !== undefined
        ? Number(profile.minBudget)
        : Number(profile.budget || 0);
    const maxBudget =
      profile.maxBudget !== undefined
        ? Number(profile.maxBudget)
        : Number(profile.budget || minBudget || 0);

    const sleepSchedule = profile.lifestyle?.sleepSchedule || 'flexible';
    const foodHabits = profile.foodHabits || 'any';
    const cleanliness = profile.lifestyle?.cleanliness || 'moderate';
    const smoking =
      typeof profile.lifestyle?.smoking === 'boolean'
        ? profile.lifestyle.smoking
          ? 'yes'
          : 'no'
        : profile.lifestyle?.smoking || 'no';
    const drinking = profile.drinking || 'never';
    const pets = profile.lifestyle?.pets || 'any';

    const res = await query(
      `
      INSERT INTO roommate_preferences (
        user_id, min_budget, max_budget, preferred_area,
        sleep_schedule, food_habits, cleanliness, smoking, drinking, pets,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        min_budget = EXCLUDED.min_budget,
        max_budget = EXCLUDED.max_budget,
        preferred_area = EXCLUDED.preferred_area,
        sleep_schedule = EXCLUDED.sleep_schedule,
        food_habits = EXCLUDED.food_habits,
        cleanliness = EXCLUDED.cleanliness,
        smoking = EXCLUDED.smoking,
        drinking = EXCLUDED.drinking,
        pets = EXCLUDED.pets,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `,
      [
        profile.id,
        minBudget,
        maxBudget,
        profile.preferredArea || '',
        sleepSchedule,
        foodHabits,
        cleanliness,
        smoking,
        drinking,
        pets,
      ]
    );
    return mapPreferenceRow(res.rows[0]);
  }

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
  mapPreferenceRow,
};
