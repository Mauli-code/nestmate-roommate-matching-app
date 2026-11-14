const {
  BadRequestException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { rankMatches } = require('./rank-matches');
const { validatePreferences } = require('../auth/validators');

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
    const resultLimit = Math.min(
      candidateProfiles.length,
      pagination.page * pagination.limit,
    );
    const rankedMatches = rankMatches(userProfile, candidateProfiles, resultLimit);
    const start = (pagination.page - 1) * pagination.limit;
    const matches = rankedMatches.slice(start, start + pagination.limit);
    const total = candidateProfiles.length;
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
    if (!candidateProfile || typeof candidateProfile !== 'object' || Array.isArray(candidateProfile)) {
      return false;
    }

    const rawCandidateId = candidateProfile.id;
    const candidateId = (typeof rawCandidateId === 'string' || typeof rawCandidateId === 'number')
      ? String(rawCandidateId).trim()
      : '';
    const normalizedProfileId = typeof profileId === 'string' ? profileId.trim() : String(profileId || '');

    if (!candidateId || candidateId === normalizedProfileId) {
      return false;
    }

    if (this.users) {
      const candidateUser = await this.users.findById(candidateId);
      if (!candidateUser || !this.users.isActive(candidateUser)) {
        return false;
      }
    }

    if (this.privacy) {
      const privacySettings = await this.privacy.forUser(candidateId);
      if (privacySettings?.showProfile !== true) {
        return false;
      }
    }

    if (
      this.moderation &&
      await this.moderation.isBlockedBetween(normalizedProfileId, candidateId)
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
    const normalizedProfileId = typeof profileId === 'string' ? profileId.trim() : String(profileId || '');

    return candidates.filter((profile) => {
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return false;
      }

      const rawId = profile.id;
      const candidateId = (typeof rawId === 'string' || typeof rawId === 'number')
        ? String(rawId).trim()
        : '';
      if (!candidateId || candidateId === normalizedProfileId || seenIds.has(candidateId)) {
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
    const values = validatePreferences(preferences);
    const { minBudget, maxBudget, preferredArea } = values;

    return {
      id: profileId,
      budget: Math.round((minBudget + maxBudget) / 2),
      minBudget,
      maxBudget,
      moveInDate: '',
      preferredArea: preferredArea.trim(),
      lifestyle: {
        sleepSchedule: values.sleepSchedule,
        cleanliness: values.cleanliness,
        smoking: values.smoking === 'yes',
        pets: values.pets,
      },
      foodHabits: values.foodHabits,
      drinking: values.drinking,
    };
  }
}

Injectable()(MatchingService);

module.exports = { MatchingService };
