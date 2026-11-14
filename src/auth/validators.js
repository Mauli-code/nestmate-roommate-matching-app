const { BadRequestException } = require('@nestjs/common');

function invalid(errors, message = 'Please check the highlighted fields') {
  throw new BadRequestException({ message, errors });
}

function validateRegistration(fullName, email, password) {
  const errors = {};
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 80) {
    errors.fullName = 'Enter a name between 2 and 80 characters.';
  }
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 ||
      !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Use at least 8 characters, including a letter and a number.';
  }
  if (Object.keys(errors).length) invalid(errors);
  return { fullName: fullName.trim(), email: email.trim().toLowerCase(), password };
}

function validateNewPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 ||
      !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    invalid({ newPassword: 'Use at least 8 characters, including a letter and a number.' });
  }
  return password;
}

function validateProfile(body) {
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    invalid({ profile: 'Profile data is required.' });
  }
  const profile = {};
  if ('fullName' in body) {
    if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.trim().length > 80) {
      errors.fullName = 'Enter a name between 2 and 80 characters.';
    } else profile.fullName = body.fullName.trim();
  }
  if ('occupation' in body) {
    if (!['student', 'working'].includes(body.occupation)) errors.occupation = 'Choose student or working.';
    else profile.occupation = body.occupation;
  }
  if ('city' in body) {
    if (typeof body.city !== 'string' || !body.city.trim() || body.city.trim().length > 80) {
      errors.city = 'Enter a city up to 80 characters.';
    } else profile.city = body.city.trim();
  }
  if ('bio' in body) {
    if (typeof body.bio !== 'string' || body.bio.length > 200) errors.bio = 'Bio must be 200 characters or fewer.';
    else profile.bio = body.bio.trim();
  }
  if ('phone' in body) {
    if (body.phone !== '' && (typeof body.phone !== 'string' || !/^\+?[0-9 ()-]{7,20}$/.test(body.phone.trim()))) {
      errors.phone = 'Enter a valid phone number or leave it blank.';
    } else profile.phone = body.phone.trim();
  }
  if (!Object.keys(profile).length && !Object.keys(errors).length) errors.profile = 'Add at least one profile field.';
  if (Object.keys(errors).length) invalid(errors);
  return profile;
}

function validatePreferences(preferences) {
  const errors = {};
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    invalid({ preferences: 'Preference data is required.' });
  }
  const isBudget = (value) =>
    (typeof value === 'string' && /^\d+$/.test(value.trim())) ||
    (typeof value === 'number' && Number.isInteger(value));
  const minBudget = isBudget(preferences.minBudget) ? Number(preferences.minBudget) : NaN;
  const maxBudget = isBudget(preferences.maxBudget) ? Number(preferences.maxBudget) : NaN;
  if (!Number.isInteger(minBudget) || minBudget < 1 || minBudget > 10000000) errors.minBudget = 'Enter a valid monthly minimum.';
  if (!Number.isInteger(maxBudget) || maxBudget < 1 || maxBudget > 10000000) errors.maxBudget = 'Enter a valid monthly maximum.';
  if (!errors.minBudget && !errors.maxBudget && maxBudget < minBudget) errors.maxBudget = 'Maximum budget must be at least the minimum.';
  if (typeof preferences.preferredArea !== 'string' || !preferences.preferredArea.trim() || preferences.preferredArea.trim().length > 100) {
    errors.preferredArea = 'Enter a preferred area up to 100 characters.';
  }
  for (const field of ['sleepSchedule', 'foodHabits', 'cleanliness', 'smoking', 'drinking']) {
    if (typeof preferences[field] !== 'string' || !preferences[field].trim() || preferences[field].length > 40) {
      errors[field] = 'Choose a valid option.';
    }
  }
  if ('pets' in preferences && (typeof preferences.pets !== 'string' || !preferences.pets.trim())) errors.pets = 'Choose a valid option.';
  if (Object.keys(errors).length) invalid(errors);
  return {
    minBudget, maxBudget, preferredArea: preferences.preferredArea.trim(),
    sleepSchedule: preferences.sleepSchedule.trim(), foodHabits: preferences.foodHabits.trim(),
    cleanliness: preferences.cleanliness.trim(), smoking: preferences.smoking.trim(),
    drinking: preferences.drinking.trim(), pets: preferences.pets || 'not-specified',
  };
}

module.exports = { validateRegistration, validateNewPassword, validateProfile, validatePreferences, invalid };
