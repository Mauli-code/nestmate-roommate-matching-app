const {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} = require('@nestjs/common');
const { AuthService } = require('./auth.service');

class AuthGuard {
  constructor(authService) {
    this.authService = authService || new AuthService();
  }

  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return false;
    }

    try {
      request.user = this.authService.verifyToken(token);
      return this.authService.verifyAuthenticatedUser(request.user).then(() => {
        request.authToken = token;
        return true;
      }).catch(() => {
        throw new UnauthorizedException('Authentication token is expired or invalid');
      });
    } catch {
      throw new UnauthorizedException('Authentication token is expired or invalid');
    }
  }
}

Injectable()(AuthGuard);
Inject(AuthService)(AuthGuard, undefined, 0);

module.exports = { AuthGuard };
