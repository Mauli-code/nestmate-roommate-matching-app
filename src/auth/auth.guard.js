const {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} = require('@nestjs/common');

class AuthGuard {
  constructor(authService) {
    this.authService = authService;
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
      request.authToken = token;
      return true;
    } catch {
      throw new UnauthorizedException('Authentication token is expired or invalid');
    }
  }
}

Injectable()(AuthGuard);

module.exports = { AuthGuard };
