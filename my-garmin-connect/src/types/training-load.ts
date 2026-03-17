export interface TrainingLoadHistory {
  date: string;
  atl: number;
  ctl: number;
  tsb: number;
}

export interface TrainingLoadData {
  currentATL: number;
  currentCTL: number;
  currentTSB: number;
  recoveryScore: number;
  readinessLabel: string;
  readinessLevel: 'high' | 'moderate' | 'low';
  factors: string[];
  insights: string[];
  history: TrainingLoadHistory[];
  sleepScore: number | null;
  avgOvernightHrv: number | null;
  restingHR: number | null;
}
