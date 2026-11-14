function validateBasics(values) {
  const errors = {};
  if (!['student', 'working'].includes(values.occupation)) errors.occupation = 'Choose student or working.';
  if (typeof values.city !== 'string' || !values.city.trim() || values.city.trim().length > 80) {
    errors.city = 'Enter a city up to 80 characters.';
  }
  if (typeof values.bio !== 'string' || values.bio.length > 200) errors.bio = 'Bio must be 200 characters or fewer.';
  return errors;
}

function validateBudget(values) {
  const errors = {};
  const validBudget = (value) => typeof value === 'string' && /^\d+$/.test(value.trim()) && Number(value) > 0;
  if (!validBudget(values.minBudget)) errors.minBudget = 'Enter a monthly minimum budget.';
  if (!validBudget(values.maxBudget)) errors.maxBudget = 'Enter a monthly maximum budget.';
  if (!errors.minBudget && !errors.maxBudget && Number(values.minBudget) > Number(values.maxBudget)) {
    errors.maxBudget = 'Maximum budget must be at least the minimum budget.';
  }
  if (typeof values.preferredArea !== 'string' || !values.preferredArea.trim() || values.preferredArea.trim().length > 100) {
    errors.preferredArea = 'Enter a preferred area up to 100 characters.';
  }
  return errors;
}

function validateLifestyle(values) {
  const errors = {};
  for (const field of ['sleepSchedule', 'foodHabits', 'cleanliness']) {
    if (typeof values[field] !== 'string' || !values[field].trim()) errors[field] = 'Choose an option.';
  }
  return errors;
}

function validateHabits(values) {
  const errors = {};
  for (const field of ['smoking', 'drinking', 'pets']) {
    if (typeof values[field] !== 'string' || !values[field].trim()) errors[field] = 'Choose an option.';
  }
  return errors;
}

function validatePreferenceStep(values, step) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return { preferences: 'Enter your preferences.' };
  if (step === 0) return validateBasics(values);
  if (step === 1) return validateBudget(values);
  if (step === 2) return validateLifestyle(values);
  if (step === 3) return validateHabits(values);
  return { step: 'Choose a valid step.' };
}

function validatePreferences(values) {
  return {
    ...validateBasics(values),
    ...validateBudget(values),
    ...validateLifestyle(values),
    ...validateHabits(values),
  };
}

module.exports = { validatePreferences, validatePreferenceStep };
