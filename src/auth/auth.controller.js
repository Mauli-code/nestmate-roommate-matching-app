const { Body, Controller, Post, Req, UseGuards } = require('@nestjs/common');
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

module.exports = { AuthController };
