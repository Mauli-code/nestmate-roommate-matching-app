const {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} = require('@nestjs/common');
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

  async logout(request) {
    return this.authService.revokeToken(request.authToken);
  }

  async getProfile(request) {
    return this.authService.getProfile(request.user.sub);
  }

  async updateProfile(request, body) {
    return this.authService.updateProfile(request.user.sub, body);
  }
}

Controller('api/auth')(AuthController);
const registerDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'register');
Post('register')(AuthController.prototype, 'register', registerDescriptor);
Body()(AuthController.prototype, 'register', 0);
const loginDescriptor = Object.getOwnPropertyDescriptor(AuthController.prototype, 'login');
Post('login')(AuthController.prototype, 'login', loginDescriptor);
Body()(AuthController.prototype, 'login', 0);
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

module.exports = { AuthController };
