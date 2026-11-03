const { calculateCompatibility } = require('./compatibility-score');

/**
 * Scores every candidate and returns the highest scores first.
 *
 * The original array is not changed. Candidates with incomplete profiles are
 * kept in the result and receive the safe score produced by the scorer.
 */
function rankMatches(userProfile, candidateProfiles) {
  if (!Array.isArray(candidateProfiles)) {
    return [];
  }

  return candidateProfiles
    .map((candidateProfile, originalIndex) => {
      const compatibility = calculateCompatibility(userProfile, candidateProfile);

      return {
        candidateId: candidateProfile?.id ?? null,
        score: compatibility.score,
        breakdown: compatibility.breakdown,
        originalIndex,
      };
    })
    .sort((firstMatch, secondMatch) => {
      const scoreDifference = secondMatch.score - firstMatch.score;
      return scoreDifference || firstMatch.originalIndex - secondMatch.originalIndex;
    })
    .map(({ originalIndex, ...match }) => match);
}

module.exports = { rankMatches };
