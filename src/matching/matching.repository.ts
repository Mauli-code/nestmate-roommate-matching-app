import { RoommateProfile } from './profile';

export const MATCHING_PROFILE_REPOSITORY = Symbol('MATCHING_PROFILE_REPOSITORY');

export interface MatchingProfileRepository {
  findCandidates(profileId: string): Promise<ReadonlyArray<RoommateProfile>>;
}
