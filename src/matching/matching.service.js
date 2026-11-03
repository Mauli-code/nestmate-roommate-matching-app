const { Injectable } = require('@nestjs/common');

class MatchingService {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async getCandidates(profileId) {
    if (typeof profileId !== 'string' || !profileId.trim()) {
      throw new Error('profileId is required');
    }

    return this.profileRepository.findCandidates(profileId);
  }
}

Injectable()(MatchingService);

module.exports = { MatchingService };
