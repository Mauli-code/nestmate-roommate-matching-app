function mergeMatches(currentMatches, nextMatches, append) {
  if (!append) {
    return [...nextMatches];
  }

  const existingIds = new Set(currentMatches.map((match) => match.candidateId));
  return [
    ...currentMatches,
    ...nextMatches.filter((match) => !existingIds.has(match.candidateId)),
  ];
}

module.exports = { mergeMatches };
