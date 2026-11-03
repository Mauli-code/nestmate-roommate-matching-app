export interface RoommateProfile {
  readonly id: string;
  readonly budget: number;
  readonly moveInDate: string;
  readonly preferredArea: string;
  readonly lifestyle: {
    readonly sleepSchedule: 'early' | 'flexible' | 'late';
    readonly cleanliness: 'low' | 'medium' | 'high';
    readonly smoking: boolean;
    readonly pets: boolean;
  };
}
