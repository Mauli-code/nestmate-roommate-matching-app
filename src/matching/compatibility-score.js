const CATEGORY_WEIGHT = 25;

/**
 * Compares two roommate profiles and returns a score from 0 to 100.
 *
 * Each category contributes 25 points:
 * budget, location, lifestyle, and habits/preferences.
 */
function calculateCompatibility(firstProfile, secondProfile) {
  const budget = budgetCompatibility(firstProfile, secondProfile);
  const location = locationCompatibility(firstProfile, secondProfile);
  const lifestyle = lifestyleCompatibility(firstProfile, secondProfile);
  const habitsAndPreferences = habitsAndPreferencesCompatibility(
    firstProfile,
    secondProfile,
  );

  const breakdown = {
    budget,
    location,
    lifestyle,
    habitsAndPreferences,
  };

  const rawScore =
    (budget + location + lifestyle + habitsAndPreferences) * CATEGORY_WEIGHT;

  return {
    score: Math.min(100, Math.max(0, Math.round(rawScore))),
    breakdown,
  };
}

function budgetCompatibility(firstProfile, secondProfile) {
  const firstBudget = validBudget(firstProfile?.budget);
  const secondBudget = validBudget(secondProfile?.budget);

  if (firstBudget === null || secondBudget === null) {
    return 0;
  }

  const largerBudget = Math.max(firstBudget, secondBudget);
  return 1 - Math.abs(firstBudget - secondBudget) / largerBudget;
}

function locationCompatibility(firstProfile, secondProfile) {
  const firstArea = normalizedArea(firstProfile?.preferredArea);
  const secondArea = normalizedArea(secondProfile?.preferredArea);

  if (firstArea === null || secondArea === null) {
    return 0;
  }

  return firstArea === secondArea ? 1 : 0;
}

function lifestyleCompatibility(firstProfile, secondProfile) {
  const firstLifestyle = firstProfile?.lifestyle;
  const secondLifestyle = secondProfile?.lifestyle;

  if (!firstLifestyle || !secondLifestyle) {
    return 0;
  }

  const sleepSchedule = matchingValue(
    firstLifestyle.sleepSchedule,
    secondLifestyle.sleepSchedule,
  );
  const cleanliness = matchingValue(
    firstLifestyle.cleanliness,
    secondLifestyle.cleanliness,
  );

  return (sleepSchedule + cleanliness) / 2;
}

function habitsAndPreferencesCompatibility(firstProfile, secondProfile) {
  const firstLifestyle = firstProfile?.lifestyle;
  const secondLifestyle = secondProfile?.lifestyle;

  if (!firstLifestyle || !secondLifestyle) {
    return 0;
  }

  const smoking = matchingValue(
    firstLifestyle.smoking,
    secondLifestyle.smoking,
  );
  const pets = matchingValue(firstLifestyle.pets, secondLifestyle.pets);

  return (smoking + pets) / 2;
}

function validBudget(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function normalizedArea(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim().toLowerCase();
}

function matchingValue(firstValue, secondValue) {
  if (firstValue === undefined || secondValue === undefined) {
    return 0;
  }

  return firstValue === secondValue ? 1 : 0;
}

module.exports = {
  calculateCompatibility,
  budgetCompatibility,
  locationCompatibility,
  lifestyleCompatibility,
  habitsAndPreferencesCompatibility,
};
