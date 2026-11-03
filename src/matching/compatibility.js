function budgetCompatibility(firstProfile, secondProfile) {
  const firstBudget = readBudget(firstProfile?.budget);
  const secondBudget = readBudget(secondProfile?.budget);

  if (firstBudget === undefined || secondBudget === undefined) {
    return 0;
  }

  const largerBudget = Math.max(firstBudget, secondBudget);
  const difference = Math.abs(firstBudget - secondBudget);

  return 1 - difference / largerBudget;
}

function locationCompatibility(firstProfile, secondProfile) {
  const firstArea = readLocation(firstProfile?.preferredArea);
  const secondArea = readLocation(secondProfile?.preferredArea);

  if (firstArea === undefined || secondArea === undefined) {
    return 0;
  }

  return firstArea === secondArea ? 1 : 0;
}

function readBudget(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new TypeError('budget must be a finite number greater than zero');
  }

  return value;
}

function readLocation(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new TypeError('preferredArea must be a string');
  }

  const normalizedArea = value.trim().toLowerCase();
  return normalizedArea || undefined;
}

module.exports = { budgetCompatibility, locationCompatibility };
