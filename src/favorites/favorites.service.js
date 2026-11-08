const path = require('node:path');
const {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { calculateCompatibility } = require('../matching/compatibility-score');
const userRepository = require('../auth/user-repository');
const profileRepository = require('../matching/profile-repository');
const favoriteRepository = require('./favorites.repository');

class FavoritesService {
  constructor(
    favorites = favoriteRepository,
    profiles = profileRepository,
    users = userRepository,
    privacy,
  ) {
    this.favorites = favorites;
    this.profiles = profiles;
    this.users = users;
    this.privacy = privacy;
  }

  async addFavorite(userId, roommateId) {
    this.validateId(userId, 'userId');
    this.validateId(roommateId, 'roommateId');
    this.rejectOwnProfile(userId, roommateId);
    await this.requireProfile(userId);
    await this.requireProfile(roommateId);

    const added = await this.favorites.addFavorite(userId, roommateId);
    if (!added) {
      throw new ConflictException('This roommate is already in your favorites');
    }

    return {
      message: 'Roommate added to favorites',
      roommateId,
    };
  }

  async removeFavorite(userId, roommateId) {
    this.validateId(userId, 'userId');
    this.validateId(roommateId, 'roommateId');
    const removed = await this.favorites.removeFavorite(userId, roommateId);
    if (!removed) {
      throw new NotFoundException('Favorite roommate was not found');
    }

    return {
      message: 'Roommate removed from favorites',
      roommateId,
    };
  }

  async getFavorites(userId) {
    this.validateId(userId, 'userId');
    const userProfile = await this.requireProfile(userId);
    const savedFavorites = await this.favorites.findByUser(userId);
    const roommates = [];

    for (const favorite of savedFavorites) {
      const profile = await this.profiles.findProfile(favorite.roommateId);
      if (!profile) {
        continue;
      }

      const user = await this.users.findById(favorite.roommateId);
      const visibility = this.privacy
        ? await this.privacy.forUser(favorite.roommateId)
        : {};
      if (visibility.showProfile === false) continue;
      roommates.push({
        roommate: this.publicRoommate(user, profile, visibility),
        compatibility: calculateCompatibility(userProfile, profile),
        createdAt: favorite.createdAt,
      });
    }

    return { favorites: roommates };
  }

  async requireProfile(profileId) {
    const profile = await this.profiles.findProfile(profileId);
    if (!profile || typeof profile !== 'object') {
      throw new NotFoundException(`Profile "${profileId}" was not found`);
    }
    return profile;
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }

  rejectOwnProfile(userId, roommateId) {
    if (userId === roommateId) {
      throw new BadRequestException('You cannot favorite your own profile');
    }
  }

  publicRoommate(user, profile, visibility = {}) {
    const publicProfile = { ...profile };
    if (visibility.showBudget === false) {
      delete publicProfile.budget;
      delete publicProfile.minBudget;
      delete publicProfile.maxBudget;
    }
    if (visibility.showLifestyle === false) {
      delete publicProfile.lifestyle;
      delete publicProfile.foodHabits;
      delete publicProfile.drinking;
    }
    return {
      id: profile.id,
      fullName: user?.fullName || 'Roommate',
      email: user?.email || null,
      photoUrl: user?.photoPath
        ? `/uploads/profile-photos/${path.basename(user.photoPath)}`
        : null,
      profile: publicProfile,
    };
  }
}

Injectable()(FavoritesService);

module.exports = { FavoritesService };
