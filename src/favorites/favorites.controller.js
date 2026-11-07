const {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { FavoritesService } = require('./favorites.service');

class FavoritesController {
  constructor(favoritesService) {
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

Controller('api/favorites')(FavoritesController);
UseGuards(AuthGuard)(FavoritesController);
Inject(FavoritesService)(FavoritesController, undefined, 0);

const addDescriptor = Object.getOwnPropertyDescriptor(
  FavoritesController.prototype,
  'addFavorite',
);
Post(':roommateId')(FavoritesController.prototype, 'addFavorite', addDescriptor);
Param('roommateId')(FavoritesController.prototype, 'addFavorite', 0);
Req()(FavoritesController.prototype, 'addFavorite', 1);

const removeDescriptor = Object.getOwnPropertyDescriptor(
  FavoritesController.prototype,
  'removeFavorite',
);
Delete(':roommateId')(
  FavoritesController.prototype,
  'removeFavorite',
  removeDescriptor,
);
Param('roommateId')(FavoritesController.prototype, 'removeFavorite', 0);
Req()(FavoritesController.prototype, 'removeFavorite', 1);

const getDescriptor = Object.getOwnPropertyDescriptor(
  FavoritesController.prototype,
  'getFavorites',
);
Get()(FavoritesController.prototype, 'getFavorites', getDescriptor);
Req()(FavoritesController.prototype, 'getFavorites', 0);

module.exports = { FavoritesController };
