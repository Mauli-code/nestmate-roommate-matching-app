const FACTORS = ['budget', 'location', 'lifestyle', 'habitsAndPreferences'];

function getCompatibilityDetails(match = {}) {
  const breakdown = match.breakdown && typeof match.breakdown === 'object'
    ? match.breakdown
    : {};
  const explanations = match.explanations && typeof match.explanations === 'object'
    ? match.explanations
    : {};

  return {
    overall: {
      score: safePercent(match.score),
      status: explanations.overall?.status || 'unavailable',
      text: explanations.overall?.text || 'Not enough information to explain compatibility.',
    },
    factors: FACTORS.map((category) => ({
      category,
      score: safePercent(Number(breakdown[category]) * 100),
      status: explanations[category]?.status || 'unavailable',
      text: explanations[category]?.text || 'Not enough information to compare this factor.',
    })),
  };
}

function safePercent(value) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

module.exports = { getCompatibilityDetails };
