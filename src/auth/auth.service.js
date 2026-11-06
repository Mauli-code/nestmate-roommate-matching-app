const crypto = require('node:crypto');
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
      throw new ConflictException('An account with this email already exists');
    }

    const user = {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
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

  async updateProfile(userId, body) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User account was not found');
    }

    if (typeof body?.fullName !== 'string' || body.fullName.trim().length < 2) {
      throw new BadRequestException('Full name must contain at least 2 characters');
    }

    const updatedUser = await this.repository.save({
      ...user,
      fullName: body.fullName.trim(),
    });

    return this.profileResponse(
      updatedUser,
      await profileRepository.findProfile(userId),
    );
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

  revokeToken(token) {
    const payload = this.verifyToken(token);
    revokedTokens.set(token, payload.exp * 1000);
    return { message: 'Logged out successfully' };
  }

  validateRegistration(fullName, email, password) {
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new BadRequestException('Full name must contain at least 2 characters');
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new BadRequestException('A valid email address is required');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException('Password must contain at least 8 characters');
    }

    return {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
  }

  createToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: TOKEN_LIFETIME,
      jwtid: crypto.randomUUID(),
    });
  }

  publicUser(user) {
    return { id: user.id, fullName: user.fullName, email: user.email };
  }

  profileResponse(user, preferences) {
    return {
      user: this.publicUser(user),
      preferences: preferences || null,
    };
  }
}

Injectable()(AuthService);

module.exports = { AuthService };
