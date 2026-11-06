const { Module } = require('@nestjs/common');
const { AuthModule } = require('./auth/auth.module');
const { MatchingModule } = require('./matching/matching.module');

class AppModule {}

Module({
  imports: [AuthModule, MatchingModule],
})(AppModule);

module.exports = { AppModule };
