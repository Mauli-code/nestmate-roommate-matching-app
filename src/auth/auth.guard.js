const { UnauthorizedException } = require('../common/exceptions');
const { AuthService } = require('./auth.service');

/**
 * Plain-JS auth guard — used in unit tests that simulate a request context.
 * No NestJS dependency; works identically to the original but without @nestjs/core.
 */
class AuthGuard {
  constructor(authService) {
    this.authService = authService || new AuthService();
  }

  /**
   * Accepts either a NestJS-style execution context (with switchToHttp)
   * or a plain request object directly.
   */
  canActivate(context) {
    const request = context?.switchToHttp
      ? context.switchToHttp().getRequest()
      : context;

    const header = request.headers?.authorization || request.headers?.Authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return false;
    }

    try {
      request.user = this.authService.verifyToken(token);
      return this.authService
        .verifyAuthenticatedUser(request.user)
        .then(() => {
          request.authToken = token;
          return true;
        })
        .catch(() => {
          throw new UnauthorizedException('Authentication token is expired or invalid');
        });
    } catch {
      throw new UnauthorizedException('Authentication token is expired or invalid');
    }
  }
}

function createAuthMiddleware(authService = new AuthService()) {
  return async function authMiddleware(req, res, next) {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      req.user = authService.verifyToken(token);
      await authService.verifyAuthenticatedUser(req.user);
      req.authToken = token;
      next();
    } catch {
      return res.status(401).json({ message: 'Authentication token is expired or invalid' });
    }
  };
}

module.exports = { AuthGuard, createAuthMiddleware };
