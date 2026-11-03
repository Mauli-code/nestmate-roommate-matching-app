import { Inject, Injectable } from '@nestjs/common';
import {
  MATCHING_PROFILE_REPOSITORY,
  MatchingProfileRepository,
} from './matching.repository';
import { RoommateProfile } from './profile';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(MATCHING_PROFILE_REPOSITORY)
    private readonly profileRepository: MatchingProfileRepository,
  ) {}

  async getCandidates(profileId: string): Promise<ReadonlyArray<RoommateProfile>> {
    if (!profileId.trim()) {
      throw new Error('profileId is required');
    }

    return this.profileRepository.findCandidates(profileId);
  }
}
