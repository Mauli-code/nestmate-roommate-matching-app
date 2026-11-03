import { Module } from '@nestjs/common';
import {
  MATCHING_PROFILE_REPOSITORY,
  MatchingProfileRepository,
} from './matching.repository';
import { MatchingService } from './matching.service';

const missingProfileRepository: MatchingProfileRepository = {
  findCandidates: async () => {
    throw new Error('MatchingProfileRepository has not been configured');
  },
};

@Module({
  providers: [
    MatchingService,
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: missingProfileRepository,
    },
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
