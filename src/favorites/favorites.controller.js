const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { FavoritesService } = require('./favorites.service');

class FavoritesController {
  constructor(favoritesService = new FavoritesService()) {
    this.favoritesService = favoritesService;
  }

  async addFavorite(roommateId, request) {
    return this.favoritesService.addFavorite(request.user.sub, roommateId);
  }

  async removeFavorite(roommateId, request) {
    return this.favoritesService.removeFavorite(request.user.sub, roommateId);
  }

  async getFavorites(request) {
    return this.favoritesService.getFavorites(request.user.sub);
  }
}

function createFavoritesRouter(favoritesService = new FavoritesService(), authService) {
  const router = express.Router();
  const controller = new FavoritesController(favoritesService);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.post('/:roommateId', async (req, res, next) => {
    try {
      const result = await controller.addFavorite(req.params.roommateId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:roommateId', async (req, res, next) => {
    try {
      const result = await controller.removeFavorite(req.params.roommateId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const result = await controller.getFavorites(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { FavoritesController, createFavoritesRouter };
