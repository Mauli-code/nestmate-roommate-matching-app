const {
  BadRequestException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { rankMatches } = require('./rank-matches');

class MatchingService {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async getCandidates(profileId) {
    this.validateProfileId(profileId);

    return this.profileRepository.findCandidates(profileId);
  }

  async getMatches(profileId) {
    this.validateProfileId(profileId);

    const userProfile = await this.profileRepository.findProfile(profileId);
    if (!userProfile || typeof userProfile !== 'object') {
      throw new NotFoundException(`Profile "${profileId}" was not found`);
    }

    const candidateProfiles = await this.getCandidates(profileId);
    if (!Array.isArray(candidateProfiles)) {
      throw new BadRequestException(
        'The profile repository returned an invalid candidate list',
      );
    }

    return {
      profileId,
      matches: rankMatches(userProfile, candidateProfiles),
    };
  }

  validateProfileId(profileId) {
    if (typeof profileId !== 'string' || !profileId.trim()) {
      throw new BadRequestException('profileId is required');
    }
  }
}

Injectable()(MatchingService);

module.exports = { MatchingService };
