const { calculateCompatibility, normalizeProfile } = require('./compatibility-score');

/**
 * Scores every candidate and returns the highest scores first.
 *
 * The original array is not changed. Candidates with incomplete profiles are
 * kept in the result and receive the safe score produced by the scorer.
 *
 * Performance: the user profile is pre-normalized once before the loop so that
 * repeated string trimming and type checks on the same user fields are avoided
 * when scoring large candidate lists.
 */
function rankMatches(userProfile, candidateProfiles, maxResults) {
  if (!Array.isArray(candidateProfiles)) {
    return [];
  }

  // Pre-normalize the user profile once so budget and preferredArea are
  // already clean values before every candidate comparison.
  const normalizedUserProfile = normalizeProfile(userProfile);

  const boundedResults = Number.isInteger(maxResults) && maxResults > 0
    && maxResults < candidateProfiles.length;
  const scoredMatches = [];

  candidateProfiles.forEach((candidateProfile, originalIndex) => {
    const compatibility = calculateCompatibility(normalizedUserProfile, candidateProfile);
    const match = {
      candidateId: candidateProfile?.id ?? null,
      score: compatibility.score,
      breakdown: compatibility.breakdown,
      explanations: compatibility.explanations,
      strengths: compatibility.strengths,
      differences: compatibility.differences,
      insights: compatibility.insights,
      originalIndex,
    };

    if (boundedResults) {
      insertRankedMatch(scoredMatches, match, maxResults);
    } else {
      scoredMatches.push(match);
    }
  });

  if (!boundedResults) {
    scoredMatches.sort(compareMatches);
  }

  return scoredMatches.map(({ originalIndex, ...match }) => match);
}

function compareMatches(firstMatch, secondMatch) {
  const scoreDifference = secondMatch.score - firstMatch.score;
  return scoreDifference || firstMatch.originalIndex - secondMatch.originalIndex;
}

function insertRankedMatch(rankedMatches, match, maxResults) {
  if (
    rankedMatches.length === maxResults &&
    compareMatches(match, rankedMatches[rankedMatches.length - 1]) >= 0
  ) {
    return;
  }

  let low = 0;
  let high = rankedMatches.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (compareMatches(match, rankedMatches[middle]) < 0) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  rankedMatches.splice(low, 0, match);
  if (rankedMatches.length > maxResults) {
    rankedMatches.pop();
  }
}

module.exports = { rankMatches };
