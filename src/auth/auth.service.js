const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} = require('@nestjs/common');
const userRepository = require('./user-repository');
const profileRepository = require('../matching/profile-repository');
const { validateRegistration, validateNewPassword, validateProfile } = require('./validators');

const JWT_SECRET = process.env.JWT_SECRET || 'nestmate-development-secret';
const TOKEN_LIFETIME = '1h';
const revokedTokens = new Map();

class AuthService {
  constructor(repository = userRepository) {
    this.repository = repository;
  }

  async register(fullName, email, password) {
    const data = this.validateRegistration(fullName, email, password);
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException({
        message: 'An account with this email already exists',
        errors: { email: 'An account with this email already exists.' },
      });
    }

    const user = {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      accountStatus: 'active',
      authVersion: 0,
    };
    const savedUser = await this.repository.save(user);

    return {
      user: this.publicUser(savedUser),
      accessToken: this.createToken(savedUser),
    };
  }

  async login(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const user = await this.repository.findByEmail(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException({
        message: 'Email or password is incorrect',
        errors: { password: 'Email or password is incorrect.' },
      });
    }
    if (!this.isActive(user)) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return {
      user: this.publicUser(user),
      accessToken: this.createToken(user),
    };
  }

  async getProfile(userId) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User account was not found');
    }

    return this.profileResponse(user, await profileRepository.findProfile(userId));
  }

    async deactivate(userId, body) {
      const user = await this.requireUser(userId);
      if (body?.confirmation !== true) {
        throw new BadRequestException('Account deactivation must be explicitly confirmed');
      }
      if (!this.isActive(user)) {
        throw new BadRequestException('This account is already unavailable');
      }
      await this.repository.save({
        ...user,
        accountStatus: 'deactivated',
        authVersion: (user.authVersion || 0) + 1,
        deactivatedAt: new Date().toISOString(),
      });
      return { message: 'Your account has been deactivated' };
    }

    async reactivate(email, password) {
      if (typeof email !== 'string' || typeof password !== 'string') {
        throw new UnauthorizedException('Email or password is incorrect');
      }
      const user = await this.repository.findByEmail(email.trim().toLowerCase());
      if (!user || !(await bcrypt.compare(password, user.passwordHash)) ||
          user.accountStatus !== 'deactivated') {
        throw new UnauthorizedException('Email or password is incorrect');
      }
      const updatedUser = await this.repository.save({
        ...user,
        accountStatus: 'active',
        authVersion: (user.authVersion || 0) + 1,
        deactivatedAt: null,
      });
      return {
        user: this.publicUser(updatedUser),
        accessToken: this.createToken(updatedUser),
      };
    }

    async requestDeletion(userId, body) {
      const user = await this.requireUser(userId);
      if (body?.confirmation !== 'DELETE') {
        throw new BadRequestException('Type DELETE to confirm permanent account deletion');
      }
      if (typeof body.password !== 'string' ||
          !(await bcrypt.compare(body.password, user.passwordHash))) {
        throw new UnauthorizedException('Password confirmation failed');
      }
      if (!this.isActive(user)) {
        throw new BadRequestException('This account is already unavailable');
      }
      await this.repository.save({
        ...user,
        accountStatus: 'deletion_requested',
        authVersion: (user.authVersion || 0) + 1,
        deletionRequestedAt: new Date().toISOString(),
      });
      return {
        message: 'Account deletion requested. Your account is now unavailable while the request is reviewed.',
      };
    }

  async updateProfile(userId, body) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User account was not found');
    }

    const changes = validateProfile(body);
    const updatedUser = await this.repository.save({ ...user, ...changes });

    return this.profileResponse(
      updatedUser,
      await profileRepository.findProfile(userId),
    );
  }

  async changePassword(userId, body) {
    const user = await this.requireUser(userId);
    if (typeof body?.oldPassword !== 'string' ||
        !(await bcrypt.compare(body.oldPassword, user.passwordHash))) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
        errors: { oldPassword: 'Current password is incorrect.' },
      });
    }
    const password = validateNewPassword(body.newPassword);
    const updatedUser = await this.repository.save({
      ...user,
      passwordHash: await bcrypt.hash(password, 12),
      authVersion: (user.authVersion || 0) + 1,
    });
    return { user: this.publicUser(updatedUser), message: 'Password changed. Please log in again.' };
  }

  async uploadPhoto(userId, file) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User account was not found');
    }

    if (!file) {
      throw new BadRequestException('A profile photo is required');
    }

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.mimetype)) {
      await this.removeUploadedFile(file);
      throw new BadRequestException('Only JPEG, PNG, and WebP images are supported');
    }

    if (file.size > 5 * 1024 * 1024) {
      await this.removeUploadedFile(file);
      throw new BadRequestException('Profile photos must be 5 MB or smaller');
    }

    if (user.photoPath && user.photoPath !== file.path) {
      await fs.unlink(user.photoPath).catch(() => {});
    }

    const updatedUser = await this.repository.save({
      ...user,
      photoPath: file.path,
    });

    return this.profileResponse(updatedUser, await profileRepository.findProfile(userId));
  }

  verifyToken(token) {
    if (!token || revokedTokens.has(token)) {
      throw new UnauthorizedException('Authentication token is invalid');
    }

    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new UnauthorizedException('Authentication token is expired or invalid');
    }
  }

  async verifyAuthenticatedUser(payload) {
    const user = await this.repository.findById(payload?.sub);
    if (!user || !this.isActive(user) ||
        (payload.authVersion || 0) !== (user.authVersion || 0)) {
      throw new UnauthorizedException('Authentication token is invalid');
    }
    return user;
  }

  revokeToken(token) {
    const payload = this.verifyToken(token);
    revokedTokens.set(token, payload.exp * 1000);
    return { message: 'Logged out successfully' };
  }

  validateRegistration(fullName, email, password) {
    return validateRegistration(fullName, email, password);
  }

  createToken(user) {
    return jwt.sign({
      sub: user.id,
      email: user.email,
      authVersion: user.authVersion || 0,
    }, JWT_SECRET, {
      expiresIn: TOKEN_LIFETIME,
      jwtid: crypto.randomUUID(),
    });
  }

  publicUser(user) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      photoUrl: user.photoPath
        ? `/uploads/profile-photos/${path.basename(user.photoPath)}`
        : null,
    };
  }

  async removeUploadedFile(file) {
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }
  }

  profileResponse(user, preferences) {
    return {
      user: {
        ...this.publicUser(user),
        occupation: user.occupation || '',
        city: user.city || '',
        bio: user.bio || '',
        phone: user.phone || '',
      },
      preferences: preferences || null,
    };
  }

  async requireUser(userId) {
    const user = await this.repository.findById(userId);
    if (!user) throw new UnauthorizedException('User account was not found');
    return user;
  }

  isActive(user) {
    return this.repository.isActive
      ? this.repository.isActive(user)
      : user?.accountStatus === undefined || user.accountStatus === 'active';
  }
}

Injectable()(AuthService);

module.exports = { AuthService };
