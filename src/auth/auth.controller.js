const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createAuthMiddleware } = require('./auth.guard');
const { AuthService } = require('./auth.service');

const photoDirectory = path.join(process.cwd(), 'uploads', 'profile-photos');
fs.mkdirSync(photoDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
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
});

class AuthController {
  constructor(authService) {
    this.authService = authService || new AuthService();
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

  async replaceProfile(request, body) {
    return this.authService.updateProfile(request.user.sub, body);
  }

  async changePassword(request, body) {
    return this.authService.changePassword(request.user.sub, body);
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

function createAuthRouter(authService = new AuthService()) {
  const router = express.Router();
  const authController = new AuthController(authService);
  const requireAuth = createAuthMiddleware(authService);

  router.post('/register', async (req, res, next) => {
    try {
      const result = await authController.register(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const result = await authController.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/reactivate', async (req, res, next) => {
    try {
      const result = await authController.reactivate(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.logout(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/profile', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.getProfile(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/profile', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.updateProfile(req, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.put('/profile', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.replaceProfile(req, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/change-password', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.changePassword(req, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/profile/photo', requireAuth, upload.single('photo'), async (req, res, next) => {
    try {
      const result = await authController.uploadPhoto(req, req.file);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/deactivate', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.deactivate(req, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/deletion-request', requireAuth, async (req, res, next) => {
    try {
      const result = await authController.requestDeletion(req, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { AuthController, createAuthRouter };
