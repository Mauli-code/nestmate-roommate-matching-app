const {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} = require('@nestjs/common');
const { FileInterceptor } = require('@nestjs/platform-express');
const { diskStorage } = require('multer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { AuthGuard } = require('./auth.guard');
const { AuthService } = require('./auth.service');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(body) {
    return this.authService.register(body?.fullName, body?.email, body?.password);
  }

  async login(body) {
    return this.authService.login(body?.email, body?.password);
  }

  async reactivate(body) {
    return this.authService.reactivate(body?.email, body?.password);
  }

  async logout(request) {
    return this.authService.revokeToken(request.authToken);
  }

  async getProfile(request) {
    return this.authService.getProfile(request.user.sub);
  }

  async updateProfile(request, body) {
    return this.authService.updateProfile(request.user.sub, body);
  }

  async uploadPhoto(request, file) {
    return this.authService.uploadPhoto(request.user.sub, file);
  }

  async deactivate(request, body) {
    return this.authService.deactivate(request.user.sub, body);
  }

  async requestDeletion(request, body) {
    return this.authService.requestDeletion(request.user.sub, body);
  }
}

Controller('api/auth')(AuthController);
const registerDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'register');
Post('register')(AuthController.prototype, 'register', registerDescriptor);
Body()(AuthController.prototype, 'register', 0);
const loginDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'login');
Post('login')(AuthController.prototype, 'login', loginDescriptor);
Body()(AuthController.prototype, 'login', 0);
const reactivateDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'reactivate');
Post('reactivate')(AuthController.prototype, 'reactivate', reactivateDescriptor);
Body()(AuthController.prototype, 'reactivate', 0);
const logoutDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'logout');
Post('logout')(AuthController.prototype, 'logout', logoutDescriptor);
Req()(AuthController.prototype, 'logout', 0);
UseGuards(AuthGuard)(AuthController.prototype, 'logout', logoutDescriptor);
const getProfileDescriptor = Object.getOwnPropertyDescriptor(
  AuthController.prototype,
  'getProfile',
);
Get('profile')(AuthController.prototype, 'getProfile', getProfileDescriptor);
Req()(AuthController.prototype, 'getProfile', 0);
UseGuards(AuthGuard)(AuthController.prototype, 'getProfile', getProfileDescriptor);
const updateProfileDescriptor = Object.getOwnPropertyDescriptor(
  AuthController.prototype,
  'updateProfile',
);
Put('profile')(AuthController.prototype, 'updateProfile', updateProfileDescriptor);
Req()(AuthController.prototype, 'updateProfile', 0);
Body()(AuthController.prototype, 'updateProfile', 1);
UseGuards(AuthGuard)(AuthController.prototype, 'updateProfile', updateProfileDescriptor);
const uploadPhotoDescriptor = Object.getOwnPropertyDescriptor(
  AuthController.prototype,
  'uploadPhoto',
);
const photoDirectory = path.join(process.cwd(), 'uploads', 'profile-photos');
fs.mkdirSync(photoDirectory, { recursive: true });
Post('profile/photo')(AuthController.prototype, 'uploadPhoto', uploadPhotoDescriptor);
UploadedFile()(AuthController.prototype, 'uploadPhoto', 1);
UseGuards(AuthGuard)(AuthController.prototype, 'uploadPhoto', uploadPhotoDescriptor);
UseInterceptors(
  FileInterceptor('photo', {
    storage: diskStorage({
      destination: photoDirectory,
      filename: (_request, file, callback) => {
        callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
      callback(null, allowedTypes.has(file.mimetype));
    },
  }),
)(AuthController.prototype, 'uploadPhoto', uploadPhotoDescriptor);
const deactivateDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'deactivate');
Post('deactivate')(AuthController.prototype, 'deactivate', deactivateDescriptor);
Req()(AuthController.prototype, 'deactivate', 0);
Body()(AuthController.prototype, 'deactivate', 1);
UseGuards(AuthGuard)(AuthController.prototype, 'deactivate', deactivateDescriptor);
const deletionDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'requestDeletion');
Post('deletion-request')(AuthController.prototype, 'requestDeletion', deletionDescriptor);
Req()(AuthController.prototype, 'requestDeletion', 0);
Body()(AuthController.prototype, 'requestDeletion', 1);
UseGuards(AuthGuard)(AuthController.prototype, 'requestDeletion', deletionDescriptor);

module.exports = { AuthController };
