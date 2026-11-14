const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

export function toMatchCard(match) {
  const id = match.candidateId;
  return {
    id,
    name: `Match ${id.slice(0, 6)}`,
    age: '',
    role: 'NestMate member',
    avatar: DEFAULT_AVATAR,
    budget: '—',
    preferredArea: 'Profile details are private',
    moveInDate: '',
    score: Math.round(match.score),
    breakdown: match.breakdown,
    lifestyle: {},
    bio: match.explanations?.overall?.text || '',
    strengths: match.strengths || [],
    differences: match.differences || [],
  };
}

export function toMatchCards(matches) {
  return Array.isArray(matches) ? matches.map(toMatchCard) : [];
}
