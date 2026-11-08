const {
  BadRequestException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { rankMatches } = require('./rank-matches');

class MatchingService {
  constructor(profileRepository, privacy) {
    this.profileRepository = profileRepository;
    this.privacy = privacy;
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

    const candidates = await this.getCandidates(profileId);
    const candidateProfiles = this.privacy
      ? (await Promise.all(candidates.map(async (profile) => ({
        profile,
        visible: (await this.privacy.forUser(profile.id)).showProfile,
      })))).filter((item) => item.visible).map((item) => item.profile)
      : candidates;
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

  async savePreferences(profileId, preferences) {
    this.validateProfileId(profileId);
    const profile = this.validatePreferences(profileId, preferences);
    return this.profileRepository.saveProfile(profile);
  }

  validatePreferences(profileId, preferences) {
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
      throw new BadRequestException('Preference data is required');
    }

    const minBudget = Number(preferences.minBudget);
    const maxBudget = Number(preferences.maxBudget);
    const preferredArea = preferences.preferredArea;
    const requiredFields = [
      'sleepSchedule',
      'foodHabits',
      'cleanliness',
      'smoking',
      'drinking',
    ];

    if (
      !Number.isInteger(minBudget) ||
      minBudget <= 0 ||
      !Number.isInteger(maxBudget) ||
      maxBudget < minBudget
    ) {
      throw new BadRequestException(
        'Budget values must be positive whole numbers, with maximum at least minimum',
      );
    }

    if (typeof preferredArea !== 'string' || !preferredArea.trim()) {
      throw new BadRequestException('preferredArea is required');
    }

    if (requiredFields.some((field) => typeof preferences[field] !== 'string' || !preferences[field].trim())) {
      throw new BadRequestException('All lifestyle preferences are required');
    }

    return {
      id: profileId,
      budget: Math.round((minBudget + maxBudget) / 2),
      minBudget,
      maxBudget,
      moveInDate: preferences.moveInDate || '',
      preferredArea: preferredArea.trim(),
      lifestyle: {
        sleepSchedule: preferences.sleepSchedule,
        cleanliness: preferences.cleanliness,
        smoking: preferences.smoking === 'yes',
        pets: preferences.pets || 'not-specified',
      },
      foodHabits: preferences.foodHabits,
      drinking: preferences.drinking,
    };
  }
}

Injectable()(MatchingService);

module.exports = { MatchingService };
