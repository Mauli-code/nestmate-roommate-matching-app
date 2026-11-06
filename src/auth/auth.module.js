const { Module } = require('@nestjs/common');
const { AuthController } = require('./auth.controller');
const { AuthGuard } = require('./auth.guard');
const { AuthService } = require('./auth.service');

const AuthModule = class {};

Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AuthGuard,
      useFactory: (authService) => new AuthGuard(authService),
      inject: [AuthService],
    },
  ],
  exports: [AuthService, AuthGuard],
})(AuthModule);

module.exports = { AuthModule };
