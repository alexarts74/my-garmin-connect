export type SoleType = 'carbon' | 'standard';

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  soleType: SoleType;
  totalDistanceMeters: number;
  retired: boolean;
  createdAt: string;
}

export interface ActivityShoeLink {
  activityId: number;
  shoeId: string;
  distanceMeters: number;
}
