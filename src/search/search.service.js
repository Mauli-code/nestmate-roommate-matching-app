const path = require('node:path');
const {
  BadRequestException,
  Injectable,
} = require('@nestjs/common');
const { calculateCompatibility } = require('../matching/compatibility-score');
const userRepository = require('../auth/user-repository');

class SearchService {
  constructor(profileRepository, users = userRepository) {
    this.profileRepository = profileRepository;
    this.users = users;
  }

  async search(userId, filters = {}) {
    const userProfile = await this.profileRepository.findProfile(userId);
    if (!userProfile || typeof userProfile !== 'object') {
      throw new BadRequestException('Your roommate preferences must be saved before searching');
    }

    const normalizedFilters = this.validateFilters(filters);
    const candidates = await this.profileRepository.findCandidates(userId);
    if (!Array.isArray(candidates)) {
      throw new BadRequestException('The profile repository returned an invalid candidate list');
    }

    const results = [];
    for (const profile of candidates) {
      if (!profile || profile.id === userId || !this.matchesFilters(profile, normalizedFilters)) {
        continue;
      }

      const compatibility = calculateCompatibility(userProfile, profile);
      const user = await this.users.findById(profile.id);
      results.push({
        profile: this.publicProfile(user, profile),
        score: compatibility.score,
        breakdown: compatibility.breakdown,
      });
    }

    results.sort((first, second) => this.compareResults(first, second, normalizedFilters.sort));
    return { filters: normalizedFilters, results };
  }

  validateFilters(filters) {
    const minBudget = this.optionalPositiveNumber(filters.minBudget, 'minBudget');
    const maxBudget = this.optionalPositiveNumber(filters.maxBudget, 'maxBudget');
    if (minBudget !== null && maxBudget !== null && maxBudget < minBudget) {
      throw new BadRequestException('maxBudget must be greater than or equal to minBudget');
    }

    const sort = filters.sort || 'compatibility';
    if (!['compatibility', 'budget', 'location'].includes(sort)) {
      throw new BadRequestException('sort must be compatibility, budget, or location');
    }

    return {
      minBudget,
      maxBudget,
      preferredArea: this.optionalText(filters.preferredArea),
      lifestyle: this.optionalText(filters.lifestyle),
      foodHabits: this.optionalText(filters.foodHabits),
      sleepSchedule: this.optionalText(filters.sleepSchedule),
      smoking: this.optionalText(filters.smoking),
      drinking: this.optionalText(filters.drinking),
      sort,
    };
  }

  optionalPositiveNumber(value, name) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      throw new BadRequestException(`${name} must be a non-negative number`);
    }
    return number;
  }

  optionalText(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('Search text filters must be non-empty strings');
    }
    return value.trim().toLowerCase();
  }

  matchesFilters(profile, filters) {
    if (filters.minBudget !== null && profile.budget < filters.minBudget) return false;
    if (filters.maxBudget !== null && profile.budget > filters.maxBudget) return false;
    if (filters.preferredArea &&
        String(profile.preferredArea || '').trim().toLowerCase() !== filters.preferredArea) {
      return false;
    }

    const lifestyle = profile.lifestyle || {};
    if (filters.lifestyle &&
        ![lifestyle.cleanliness, lifestyle.sleepSchedule].some(
          (value) => String(value || '').toLowerCase() === filters.lifestyle,
        )) return false;
    if (filters.sleepSchedule &&
        String(lifestyle.sleepSchedule || '').toLowerCase() !== filters.sleepSchedule) return false;
    if (filters.smoking && this.preferenceValue(lifestyle.smoking) !== filters.smoking) return false;
    if (filters.foodHabits &&
        String(profile.foodHabits || '').toLowerCase() !== filters.foodHabits) return false;
    if (filters.drinking &&
        String(profile.drinking || '').toLowerCase() !== filters.drinking) return false;
    return true;
  }

  preferenceValue(value) {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return String(value || '').toLowerCase();
  }

  compareResults(first, second, sort) {
    if (sort === 'budget') {
      return (first.profile.budget || 0) - (second.profile.budget || 0);
    }
    if (sort === 'location') {
      return first.profile.preferredArea.localeCompare(second.profile.preferredArea);
    }
    return second.score - first.score;
  }

  publicProfile(user, profile) {
    return {
      id: profile.id,
      fullName: user?.fullName || 'Roommate',
      photoUrl: user?.photoPath
        ? `/uploads/profile-photos/${path.basename(user.photoPath)}`
        : null,
      budget: profile.budget,
      preferredArea: profile.preferredArea,
      lifestyle: profile.lifestyle || {},
      foodHabits: profile.foodHabits || null,
      drinking: profile.drinking || null,
    };
  }
}

Injectable()(SearchService);

module.exports = { SearchService };
