const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { SearchService } = require('./search.service');

class SearchController {
  constructor(searchService = new SearchService()) {
    this.searchService = searchService;
  }

  async search(query, request) {
    return this.searchService.search(request.user.sub, query);
  }
}

function createSearchRouter(searchService, authService) {
  const router = express.Router();
  const controller = new SearchController(searchService);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const result = await controller.search(req.query, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { SearchController, createSearchRouter };
