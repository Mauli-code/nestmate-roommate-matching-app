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
    explanations: createExplanations(
      firstProfile,
      secondProfile,
      breakdown,
      rawScore,
    ),
  };
}

function createExplanations(firstProfile, secondProfile, breakdown, rawScore) {
  const explanations = {
    budget: explainBudget(firstProfile, secondProfile, breakdown.budget),
    location: explainLocation(firstProfile, secondProfile, breakdown.location),
    lifestyle: explainPairedPreferences(
      firstProfile?.lifestyle,
      secondProfile?.lifestyle,
      ['sleepSchedule', 'cleanliness'],
      breakdown.lifestyle,
      'lifestyle',
    ),
    habitsAndPreferences: explainPairedPreferences(
      firstProfile?.lifestyle,
      secondProfile?.lifestyle,
      ['smoking', 'pets'],
      breakdown.habitsAndPreferences,
      'habits',
    ),
  };
  const availableFactors = Object.values(explanations)
    .filter((explanation) => explanation.status !== 'unavailable').length;
  const roundedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    ...explanations,
    overall: availableFactors === 0
      ? {
        status: 'unavailable',
        text: 'Not enough profile information to compare compatibility.',
      }
      : {
        status: scoreStatus(roundedScore),
        text: `${roundedScore}% overall compatibility across the available factors.`,
      },
  };
}

function explainBudget(firstProfile, secondProfile, score) {
  const firstBudget = validBudget(firstProfile?.budget);
  const secondBudget = validBudget(secondProfile?.budget);
  if (firstBudget === null || secondBudget === null) {
    return unavailableExplanation('Budget information is incomplete.');
  }

  const text = score === 1
    ? 'Budgets are the same.'
    : score >= 0.75
      ? 'Budgets are closely aligned.'
      : score > 0
        ? 'Budgets are partly aligned.'
        : 'Budgets are quite different.';
  return { status: scoreStatus(score * 100), text };
}

function explainLocation(firstProfile, secondProfile, score) {
  const firstArea = normalizedArea(firstProfile?.preferredArea);
  const secondArea = normalizedArea(secondProfile?.preferredArea);
  if (firstArea === null || secondArea === null) {
    return unavailableExplanation('Location information is incomplete.');
  }

  return score === 1
    ? { status: 'match', text: 'Preferred locations match.' }
    : { status: 'different', text: 'Preferred locations are different.' };
}

function explainPairedPreferences(
  firstPreferences,
  secondPreferences,
  fields,
  score,
  category,
) {
  const availableFields = fields.filter((field) =>
    hasValue(firstPreferences?.[field]) && hasValue(secondPreferences?.[field]));
  if (availableFields.length === 0) {
    return unavailableExplanation(`${capitalize(category)} preferences are incomplete.`);
  }

  const matchingFields = availableFields.filter((field) =>
    firstPreferences[field] === secondPreferences[field]);
  const text = `${matchingFields.length} of ${availableFields.length} available ${category} preferences match.`
    + (matchingFields.length < availableFields.length ? ' Some preferences differ.' : '')
    + (availableFields.length < fields.length ? ' Some preferences are missing.' : '');
  return { status: scoreStatus(score * 100), text };
}

function unavailableExplanation(text) {
  return { status: 'unavailable', text };
}

function scoreStatus(score) {
  if (score >= 75) return 'strong match';
  if (score > 0) return 'partial match';
  return 'different';
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  if (!hasValue(firstValue) || !hasValue(secondValue)) {
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
