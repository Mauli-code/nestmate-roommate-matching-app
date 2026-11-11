const {
  BadRequestException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { rankMatches } = require('./rank-matches');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

class MatchingService {
  constructor(profileRepository, privacy, moderation, users) {
    this.profileRepository = profileRepository;
    this.privacy = privacy;
    this.moderation = moderation;
    this.users = users;
  }

  async getCandidates(profileId) {
    this.validateProfileId(profileId);

    return this.profileRepository.findCandidates(profileId);
  }

  async getMatches(profileId, page, limit) {
    this.validateProfileId(profileId);
    const pagination = this.validatePagination(page, limit);

    if (this.users) {
      const user = await this.users.findById(profileId);
      if (!user || (this.users.isActive && !this.users.isActive(user))) {
        throw new NotFoundException(`User profile "${profileId}" was not found`);
      }
    }

    const userProfile = await this.profileRepository.findProfile(profileId);
    if (!userProfile || typeof userProfile !== 'object') {
      throw new NotFoundException(`Roommate preferences for "${profileId}" were not found`);
    }

    const candidates = await this.getCandidates(profileId);
    if (!Array.isArray(candidates)) {
      throw new BadRequestException(
        'The profile repository returned an invalid candidate list',
      );
    }
    const safeCandidates = this.normalizeCandidates(profileId, candidates);
    const candidateProfiles = (
      await Promise.all(safeCandidates.map(async (profile) => ({
        profile,
        eligible: await this.isEligibleCandidate(profileId, profile),
      })))
    ).filter((item) => item.eligible).map((item) => item.profile);
    const rankedMatches = rankMatches(userProfile, candidateProfiles);
    const start = (pagination.page - 1) * pagination.limit;
    const matches = rankedMatches.slice(start, start + pagination.limit);
    const total = rankedMatches.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.limit);

    return {
      profileId,
      matches,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1 && totalPages > 0,
    };
  }

  async isEligibleCandidate(profileId, candidateProfile) {
    if (!candidateProfile || candidateProfile.id === profileId) {
      return false;
    }

    if (this.users) {
      const candidateUser = await this.users.findById(candidateProfile.id);
      if (!candidateUser || !this.users.isActive(candidateUser)) {
        return false;
      }
    }

    if (this.privacy) {
      const privacySettings = await this.privacy.forUser(candidateProfile.id);
      if (privacySettings?.showProfile !== true) {
        return false;
      }
    }

    if (
      this.moderation &&
      await this.moderation.isBlockedBetween(profileId, candidateProfile.id)
    ) {
      return false;
    }

    return true;
  }

  validatePagination(page, limit) {
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? DEFAULT_PAGE_SIZE : Number(limit);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new BadRequestException('page must be a positive whole number');
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('limit must be a positive whole number');
    }

    return {
      page: parsedPage,
      limit: Math.min(parsedLimit, MAX_PAGE_SIZE),
    };
  }

  normalizeCandidates(profileId, candidates) {
    const seenIds = new Set();

    return candidates.filter((profile) => {
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return false;
      }

      const candidateId = typeof profile.id === 'string' ? profile.id.trim() : '';
      if (!candidateId || candidateId === profileId || seenIds.has(candidateId)) {
        return false;
      }

      seenIds.add(candidateId);
      return true;
    });
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
