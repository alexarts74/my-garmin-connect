export interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  distance: number; // meters
  duration: number; // seconds
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  averageHR: number;
  maxHR: number;
  calories: number;
  elevationGain: number;
  elevationLoss: number;
  activityType: {
    typeKey: string;
    typeId: number;
  };
}

export interface GarminActivityDetail extends GarminActivity {
  description: string | null;
  averageRunningCadenceInStepsPerMinute: number;
  maxRunningCadenceInStepsPerMinute: number;
  steps: number;
  vO2MaxValue: number;
  strideLength: number | null;
  lapDTOs: GarminLap[];
}

export interface GarminLap {
  lapNumber: number;
  startTimeLocal: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  averageHR: number;
  maxHR: number;
  calories: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GarminTokens {
  oauth1: {
    oauth_token: string;
    oauth_token_secret: string;
  };
  oauth2: {
    scope: string;
    jti: string;
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in: number;
    expires_at: number;
    refresh_token_expires_at: number;
    last_update_date: string;
    expires_date: string;
  };
}

export interface LoginResponse {
  success: boolean;
  tokens?: GarminTokens;
  error?: string;
}

export interface RestoreRequest {
  oauth1: GarminTokens['oauth1'];
  oauth2: GarminTokens['oauth2'];
}

export interface AuthStatus {
  authenticated: boolean;
}
