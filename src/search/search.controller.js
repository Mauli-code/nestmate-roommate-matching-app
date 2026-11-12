const {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { SearchService } = require('./search.service');

class SearchController {
  constructor(searchService) {
    this.searchService = searchService;
  }

  async search(query, request) {
    return this.searchService.search(request.user.sub, query);
  }
}

Controller('api/search')(SearchController);
UseGuards(AuthGuard)(SearchController);
Inject(SearchService)(SearchController, undefined, 0);
const searchDescriptor = Object.getOwnPropertyDescriptor(SearchController.prototype, 'search');
Get()(SearchController.prototype, 'search', searchDescriptor);
Query()(SearchController.prototype, 'search', 0);
Req()(SearchController.prototype, 'search', 1);

module.exports = { SearchController };
