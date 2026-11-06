function validatePreferences(preferences) {
  const errors = {};

  if (!preferences.minBudget.trim() || !/^\d+$/.test(preferences.minBudget)) {
    errors.minBudget = 'Enter a monthly minimum budget.';
  }

  if (!preferences.maxBudget.trim() || !/^\d+$/.test(preferences.maxBudget)) {
    errors.maxBudget = 'Enter a monthly maximum budget.';
  }

  if (
    !errors.minBudget &&
    !errors.maxBudget &&
    Number(preferences.minBudget) > Number(preferences.maxBudget)
  ) {
    errors.maxBudget = 'Maximum budget must be at least the minimum budget.';
  }

  if (!preferences.preferredArea.trim()) {
    errors.preferredArea = 'Enter a preferred location.';
  }

  for (const field of ['sleepSchedule', 'foodHabits', 'cleanliness', 'smoking', 'drinking']) {
    if (!preferences[field]) {
      errors[field] = 'Choose an option.';
    }
  }

  return errors;
}

module.exports = { validatePreferences };
