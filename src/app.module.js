const { Module } = require('@nestjs/common');
const { MatchingModule } = require('./matching/matching.module');

class AppModule {}

Module({
  imports: [MatchingModule],
})(AppModule);

module.exports = { AppModule };
