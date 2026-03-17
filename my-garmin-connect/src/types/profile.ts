export interface UserProfile {
  displayName: string | null;
  fullName: string | null;
  profileImageUrl: string | null;
  location: string | null;
  bio: string | null;
  userLevel: number | null;
  userPoint: number | null;
  userPro: boolean;
  weight: number | null;
  height: number | null;
  birthDate: string | null;
  gender: string | null;
  vo2MaxRunning: number | null;
  lactateThresholdSpeed: number | null;
  runningTrainingSpeed: number | null;
  measurementSystem: string | null;
}
